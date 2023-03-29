/**
 * Project: NodeJS-CMS
 *
 * (c) GPL-3.0 license
 **/

// const Path = require('path');

const dir = __dirname.substring(0, __dirname.indexOf('/plugin/'));
const {System} = require(dir + '/lib/system.js');
const {SQLiteStorage} = System.require('SQLiteStorage');
const {Content,ContentBag} = System.require('content');

class Species {
  taxonID;
  order;
  family;
  genus;
  scientificName;
  vernacularName = [];
  images = [];
}

class PlantStorage extends SQLiteStorage
{
  getPlants(filter)
  {
    let sql = '',join = '',where = '',limit = '', params = [];

    const cols = [
      'taxa.taxonID',
      'taxa.`order`',
      'taxa.family',
      'taxa.genus',
      'taxa.scientificName',
      // 'namen.vernacularName',
      // 'json_group_array(namen.vernacularName) as vernacularName',
      'vernacularNames',
      // 'json_group_array(media.accessURI) as images',
      'images'
    ];

    if(filter.query) {
      where += 'AND namen.vernacularName LIKE ? ';
      where += 'OR taxa.scientificName LIKE ? ';
      params.push('%'+filter.query+'%', '%'+filter.query+'%');
    }
    else if(filter.taxonID) {
      where += 'AND taxa.taxonID = ? ';
      limit += 'LIMIT 1 ';
      params.push(filter.taxonID);
    }
    else if(filter.taxonIDs) {
      where += 'AND taxa.taxonID IN(?) ';
      params.push(filter.taxonIDs);
    }

    if(filter.parentId) {
      join += `inner join (
        select distinct content_meta2.value as tid from content_meta2
        inner join content_xref using(ref)
        where content_xref.parentRef=? and content_meta2.key="taxonID"
      ) on taxa.taxonID=tid `;
      params.push(filter.parentId);
    }

    join += `LEFT OUTER JOIN (select id as mid, json_group_array(json_object(
      'license', media.license,
      'holder', media.rightsHolder,
      'uri', media.accessURI)
    ) as images from media group by mid) on taxa.taxonID=mid `;

    join += `LEFT OUTER JOIN (
      SELECT taxonID,  JSON_GROUP_ARRAY(vernacularName) AS vernacularNames
      FROM namen GROUP BY taxonID ORDER BY taxonID
    ) using(taxonID)`;

    sql = `
      SELECT ${cols.join(',')} FROM taxa
      LEFT OUTER JOIN namen USING(taxonID)
      LEFT OUTER JOIN media ON taxonID=media.id
      ${join}
      WHERE 1 ${where} GROUP BY taxonID ${limit}`;

    const plants = new Map();
    const parse = ['vernacularNames','images'];

    return this._getPromise('each',sql, params, (row)=>{

      const species = new Species();
      for(const v in row) {

// if(v == 'images') console.log(JSON.parse(row[v]));

        if(parse.indexOf(v) != -1) {
          if(row[v] != '[null]') species[v] = JSON.parse(row[v]);
        }
        else (v in species) && (species[v] = row[v]);
      }
      plants.set(species.taxonID, species);

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

  checkIfPlantIsLinked( parentRef, taxonID )
  {
    let sql = '', params = [];

    sql += 'select count(*) from content ';
    sql += 'inner join content_xref using(ref) ';
    sql += 'inner join content_meta using(ref) ';
    sql += 'where parentRef=? ';
    sql += 'and content_meta.key="taxonID" ';
    sql += 'and content_meta.value=? ';

    return this._getPromise('run',sql, [parentRef, taxonID], (row)=>{
      console.log(row);
    }).catch( err => this._dbError(err) );
  }
}

class PlantFilter
{
  query;
  taxonID;
  taxonIDs;
  constructor(options) {
    for(const k in options) this[k] = options[k];
  }
}

class Plant extends Content {
  get editor() { return true; }
}
Content.registerContentType('plant', Plant);

class Garden extends ContentBag
{
  #_plants = new Map();

  getPlantInfo( taxonID )
  {
    return this.#_plants.get(taxonID);
  }

  async handleRequest()
  {
    this.#_plants = await Service.getPlantsForContent(this.ref);
  }
}
Content.registerContentType('garden', Garden);
Content.registerContentTemplate('garden', __dirname+'/garden.pug');

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

  static getPlantsForContent( contentRef ) {
    const storage = new PlantStorage();
    return storage.getPlants(new PlantFilter({
      parentRef: contentRef
    }));
  }

  static getPlantInfo(taxonID) {
    const storage = new PlantStorage();
    return storage.getPlants(new PlantFilter({
      taxonID: taxonID
    }));
  }

  static async isPlantLinked( parentRef, taxonID) {
    const storage = new PlantStorage();
    return await storage.checkIfPlantIsLinked(parentRef, taxonID);
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

        // Check for doubles
        if(Service.isPlantLinked( parentRef, taxonID)) {
          console.log('Plant already linked jong!!');
        }

        // if(typeof taxonIDs === 'string') {
        //   const res = await Service.addPlantContent(taxonIDs, parentRef);
        // }
        // else for(const taxonID of taxonIDs) {
        //   const res = await Service.addPlantContent(taxonID, parentRef);
        // }
        if(typeof taxonIDs === 'string') taxonIDs = [taxonIDs];
        for(const taxonID of taxonIDs) {
          const res = await Service.addPlantContent(taxonID, parentRef);
        }
      } else {
        throw new TypeError('BAD REQUEST');
      }

      service.redirect('/admin/plugins?plugin=plant');
      return;
    }

    //
    // HTTP GET
    //

    const content = await Service.getPlantContent();
    if(content.size) {
      const ref = Array.from(content.keys())[0];
      const xref = await Content.getContentXRef(ref);
      service.data.parentRef = xref.parentRef;
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
