
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

INSERT INTO content (ref,type,title,content)
VALUES ('lorem-ipsum','article','Lorem Ipsum Dolor','lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus rutrum nibh non orci pellentesque rutrum. In nec velit nibh. Suspendisse posuere volutpat ipsum. Etiam felis augue, fermentum id mollis at, pretium ut dui. Maecenas ac nulla quis lorem efficitur varius. Aliquam pellentesque sem vitae pellentesque semper. Nam ut aliquam neque. Morbi faucibus eleifend risus, sed scelerisque ex consectetur in. In pharetra turpis vel fringilla imperdiet. ');

INSERT INTO content (ref,type,title,content)
VALUES ('welcome','article','In an electric glare','A hand in my mouth\nA life spills into the flowers\nWe all look so perfect\nAs we all fall down\nIn an electric glare\nThe old man cracks with age\nShe found his last picture\nIn the ashes of the fire\nAn image of the queen\nEchoes round the sweating bed\nSour yellow sounds inside my head');
