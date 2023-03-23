
-- Key-Value Settings
CREATE TABLE IF NOT EXISTS settings_kv (
  key TEXT NOT NULL UNIQUE,
  value TEXT DEFAULT '',
  name TEXT NOT NULL,
  type TEXT DEFAULT 'text',
  note TEXT DEFAULT ''
);

INSERT INTO settings_kv (key,name,note,value,type) VALUES
('site_title','Site title','Site title','My Title','text'),
('site_subtitle','Site subtitle','Site subtitle','My Subtitle','text');

INSERT INTO settings_kv (key,name,note,value,type) VALUES
('site_brand','Site brand','Site brand','My Brand','text');

CREATE TABLE IF NOT EXISTS content (
  ref TEXT NOT NULL UNIQUE ON CONFLICT ROLLBACK,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  pubDate TEXT,
  cDate TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'draft',
  link TEXT,
  content TEXT
);

CREATE TABLE content_xref (
  ref TEXT NOT NULL,
  parentRef TEXT NOT NULL,
  sorder NUMBER DEFAULT 0
);

-- Articles
INSERT INTO content (ref,type,title,content)
VALUES ('lorem-ipsum','article','Lorem Ipsum Dolor','lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus rutrum nibh non orci pellentesque rutrum. In nec velit nibh. Suspendisse posuere volutpat ipsum. Etiam felis augue, fermentum id mollis at, pretium ut dui. Maecenas ac nulla quis lorem efficitur varius. Aliquam pellentesque sem vitae pellentesque semper. Nam ut aliquam neque. Morbi faucibus eleifend risus, sed scelerisque ex consectetur in. In pharetra turpis vel fringilla imperdiet. ');

INSERT INTO content (ref,type,title,content)
VALUES ('welcome','article','In an electric glare','A hand in my mouth\nA life spills into the flowers\nWe all look so perfect\nAs we all fall down\nIn an electric glare\nThe old man cracks with age\nShe found his last picture\nIn the ashes of the fire\nAn image of the queen\nEchoes round the sweating bed\nSour yellow sounds inside my head');

-- RSS feed
INSERT INTO content (ref,type,title) VALUES ('rss-feed','rss','RSS Feed');
INSERT INTO content_xref (parentRef,ref) VALUES ('rss-feed','lorem-ipsum');
INSERT INTO content_xref (parentRef,ref) VALUES ('rss-feed','welcome');

-- Menu
INSERT INTO content (ref,type,title) VALUES ('topmenu','menu','Top menu');
INSERT INTO content (ref,type,title,link) VALUES ('topmenu-item1','link','Lorem','/lorem-ipsum');
INSERT INTO content (ref,type,title,link) VALUES ('topmenu-item2','link','Welcome','/welcome');
INSERT INTO content_xref (parentRef,ref,sorder) VALUES ('topmenu','topmenu-item2',1);
INSERT INTO content_xref (parentRef,ref,sorder) VALUES ('topmenu','topmenu-item1',2);

-- Socials
INSERT INTO content (ref,type,title) VALUES ('socials','socials','Socials');
INSERT INTO content (ref,type,title,link) VALUES ('twitter','link','Twitter','https://twitter.com/dheerlijkheid');
INSERT INTO content (ref,type,title,link) VALUES ('facebook','link','Facebook','https://www.facebook.com/dheerlijkheid');
INSERT INTO content (ref,type,title,link) VALUES ('instagram','link','Instagram','https://www.instagram.com/dheerlijkheid/');
INSERT INTO content_xref (parentRef,ref,sorder) VALUES ('socials','twitter',1);
INSERT INTO content_xref (parentRef,ref,sorder) VALUES ('socials','facebook',2);
INSERT INTO content_xref (parentRef,ref,sorder) VALUES ('socials','instagram',3);

-- Get Content Bag
SELECT content.* FROM content
INNER JOIN content_xref USING(ref) WHERE content_xref.parentRef='socials'
ORDER BY  content_xref.sorder)


select content.* from content
left outer join content_xref USING(ref)
where ref='socials' or ref in (select ref from content_xref where parentRef='socials')
order by sorder ASC

select * from content
left outer join content_xref USING(ref)
--where ref='socials' or ref in (select ref from content_xref where parentRef='socials')
order by parentRef ASC, sorder ASC

select content.* from content
where 1
and content.ref NOT IN (SELECT distinct ref FROM content_xref)



select taxa.taxonID, taxa.scientificName, namen.vernacularName from taxa left outer join namen using(taxonID)
-- where namen.vernacularName  like '%prei%'
where taxa.scientificName like '%allium%'

select taxa.taxonID, taxa.scientificName, namen.vernacularName, media.accessURI
from taxa
left outer join namen using(taxonID)
left outer join media on media.id = taxa.taxonID
where namen.vernacularName  like '%duizendblad%'
