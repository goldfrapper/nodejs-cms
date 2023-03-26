/**
 * Project: NodeJS-CMS
 *
 * (c) GPL-3.0 license
 **/

// const Path = require('path');

const dir = __dirname.substring(0, __dirname.indexOf('/plugin/'));
const {System} = require(dir + '/lib/system.js');
const {SQLiteStorage} = System.require('SQLiteStorage');
const {Content} = System.require('content');

class PlantStorage extends SQLiteStorage
{
  getPlants(filter)
  {
    let sql = '', params = [];

    const cols = [
      'taxa.taxonID',
      'taxa.`order`',
      'taxa.family',
      'taxa.genus',
      'taxa.scientificName',
      'namen.vernacularName'
    ];

    sql += 'SELECT '+cols.join(',')+' FROM taxa ';
    sql += 'left outer join namen using(taxonID) ';

    if(filter.query) {
      sql += 'WHERE namen.vernacularName LIKE ? ';
      sql += 'OR taxa.scientificName LIKE ? ';
      params.push('%'+filter.query+'%', '%'+filter.query+'%');
    }
    else if(filter.taxonID) {
      sql += 'WHERE taxa.taxonID = ? ';
      sql += 'LIMIT 1 ';
      params.push(filter.taxonID);
    }

    const plants = new Set();
    return this._getPromise('each',sql, params, (row)=>{
      plants.add(row);
    }).then(x=>{
      if(filter.taxonID) return plants.values().next().value;
      else return plants;
    }).catch( err => this._dbError(err) );
  }

  getPlantContent()
  {
    let sql = '', params = [];

    sql += 'select * from content inner join content_meta using(ref)';
    sql += 'where content_meta.key = "taxonID"';

    const content = new Map();
    return this._getPromise('each',sql, params, (row)=>{
      const plant = Content.createContentInstance(row);
      content.set(plant.ref, plant);
    }).then(x=>{
      return content;
    }).catch( err => this._dbError(err) );
  }
}

class PlantFilter
{
  query;
  taxonID;
  constructor(options) {
    for(const k in options) this[k] = options[k];
  }
}

class Plant extends Content {
  get editor() { return true; }
}
Content.registerContentType('plant', Plant);

class Service
{
  // taxonID;
  // scientificName;
  // vernacularName;

  static searchPlants(query)
  {
    const storage = new PlantStorage();
    return storage.getPlants(new PlantFilter({
      query: query
    }));
  }

  static getPlantInfo(taxonID) {
    const storage = new PlantStorage();
    return storage.getPlants(new PlantFilter({
      taxonID: taxonID
    }));
  }

  static getPlantContent()
  {
    const storage = new PlantStorage();
    return storage.getPlantContent();
  }

  static removePlantContent(ref)
  {
    const content = Content.createContentInstance({ref:ref});
    const res = Content.removeContent(content);
  }

  static async addPlantContent(taxonID, parentRef)
  {
    if(!taxonID) {
      throw new TypeError('taxonID is required');
    }
    const info = await Service.getPlantInfo(taxonID);

    if(!info) {
      throw new TypeError('taxonID is unknown: '+taxonID);
    }

    // console.log(taxonID, info);

    let c = `### ${info.vernacularName} *[${info.scientificName}]*\n\n`;
    c += `Order: **${info.order}** - Family: **${info.family}** - Genus: **${info.genus}**`;
    c += '\n\n\---';

    const link = '/planten/'+info.vernacularName.toLowerCase().replace(/\s/,'-');
    const plant = Content.createContentInstance({
      type: 'plant',
      link: link,
      title: info.vernacularName + ' ['+info.scientificName+']',
      content: c
    });

    await Content.saveContent(plant);
    await Content.saveContentXRef(parentRef, plant.ref);
    await Content.setContentMeta(plant.ref, 'taxonID', taxonID);

    return plant;
  }

  static async handleRequest(service)
  {

    if(service.method == 'POST') {
      const post = await service.getStore();

      if(post.has('remove')) {
        const ref = post.get('ref');
        const res = await Service.removePlantContent(ref);
      }
      else if(post.has('add')) {
        const parentRef = post.get('parentRef');
        const taxonIDs = post.get('taxonIds');

        if(typeof taxonIDs === 'string') {
          const res = await Service.addPlantContent(taxonIDs, parentRef);
        }
        else for(const taxonID of taxonIDs) {
          const res = await Service.addPlantContent(taxonID, parentRef);
        }
      } else {
        throw new TypeError('BAD REQUEST');
      }

      service.redirect('/admin/plugins?plugin=plant');
      return;
    }

    const content = await Service.getPlantContent();
    if(content.size) {
      const ref = Array.from(content.keys())[0];
      const xref = await Content.getContentXRef(ref);
      console.log(xref);
    }

    const query = service.getParam('query');
    const plants = query? await Service.searchPlants(query) : [];

    service.data.contentlist = await Content.getContent();
    service.data.content = content;
    service.data.query = query;
    service.data.plants = plants || [];
    service.template = __dirname + '/admin.pug';
  }
}

module.exports = Service;
