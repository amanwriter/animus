create table pages(
page_id serial,
page_image_src VARCHAR(50),
page_aruco_ids VARCHAR(20),
is_page_active boolean default false,
PRIMARY KEY (page_id)
);

create table triggers(
trigger_id serial,
pg_id INTEGER,
type VARCHAR(10),
src VARCHAR(50),
location_pnt point,
location_box box,
is_trigger_active boolean default false,
PRIMARY KEY (trigger_id)
);
