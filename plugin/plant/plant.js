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
  //

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

    // if(filter.taxonID) {
    //   cols = [
    //
    //   ]
    // }

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
}

class PlantFilter
{
  query;
  taxonID;
  constructor(options) {
    for(const k in options) this[k] = options[k];
  }
}

class Plant extends Content
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

  get editor() { return true; }

  static async addPlantContent(taxonID)
  {
    const storage = new PlantStorage();

    const info = await Plant.getPlantInfo(taxonID);

    let c = `## ${info.vernacularName} *[${info.scientificName}]*\n\n`;
    c += `*Order: ${info.order} - Family: ${info.family} - Genus: ${info.genus}*`;

    const link = '/'+info.vernacularName.toLowerCase().replace(/\s/,'-');
    const plant = Content.createContentInstance({
      type: 'plant',
      link: link,
      title: info.vernacularName + ' ['+info.scientificName+']',
      content: c
    });

    await Content.saveContent(plant);
    await Content.setContentMeta(plant.ref, 'taxonID', taxonID);

    return plant;
  }
}
Content.registerContentType('plant', Plant);

module.exports = Plant;
