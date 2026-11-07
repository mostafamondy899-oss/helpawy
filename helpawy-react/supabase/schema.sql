-- Helpawy schema. Run in the Supabase SQL editor. Turn ON "Confirm email" in Auth settings (the admin email gets the admin role on signup).
create table profiles(id uuid primary key references auth.users on delete cascade,email text,name text default '',role text not null default 'user' check(role in('user','admin')),profile jsonb,state jsonb not null default '{}',created_at timestamptz default now());
create table business_stages(name text primary key);create table goals(name text primary key);create table challenges(name text primary key);
create table business_profiles(user_id uuid primary key references profiles on delete cascade,type text,stage text,goal text,challenge text,interests text[]);
create table service_categories(name text primary key);
create table services(id text primary key,name text not null,description text,icon text,category text references service_categories(name),stages text[]);
create table experts(id text primary key,name text not null,title text,industry text,category text,bio text,stages text[],availability text,photo_url text);
create table events(id text primary key,name text not null,description text,speaker text,event_date text,event_time text,location text,mode text,category text,stages text[],is_workshop boolean default false);
create table resources(id text primary key,name text not null,description text,type text,category text,stages text[],level text,minutes int);
create table journey_steps(id int primary key,name text,description text);
create table tasks(id text primary key,title text,category text,stage text);
create table registrations(user_id uuid references profiles on delete cascade,event_id text references events on delete cascade,primary key(user_id,event_id));
create table saved_resources(user_id uuid references profiles on delete cascade,resource_id text references resources on delete cascade,used boolean default false,primary key(user_id,resource_id));
create table user_tasks(user_id uuid references profiles on delete cascade,task_id text references tasks on delete cascade,status text default 'todo',primary key(user_id,task_id));
create table recommendations(id bigserial primary key,user_id uuid references profiles on delete cascade,kind text,item_id text,reason text,created_at timestamptz default now());
create table notifications(id bigserial primary key,user_id uuid references profiles on delete cascade,message text,read boolean default false,created_at timestamptz default now());
create table ai_conversations(id bigserial primary key,user_id uuid references profiles on delete cascade,role text,content jsonb,created_at timestamptz default now());
create table progress(user_id uuid primary key references profiles on delete cascade,percent int default 0,current_step int default 1);
create table analytics_events(id bigserial primary key,user_id uuid references profiles on delete set null,event text,props jsonb,created_at timestamptz default now());
create table settings(key text primary key,value jsonb not null default '{}');
create function is_admin() returns boolean language sql security definer stable set search_path=public as $$ select exists(select 1 from profiles where id=auth.uid() and role='admin') $$;
alter table profiles enable row level security;
create policy "own or admin read" on profiles for select using(id=auth.uid() or is_admin());
create policy "own update" on profiles for update using(id=auth.uid()) with check(id=auth.uid() and (role='user' or is_admin()));
do $$ declare t text; begin
 foreach t in array array['business_stages','goals','challenges','service_categories','services','experts','events','resources','journey_steps','tasks','settings'] loop
  execute format('alter table %I enable row level security',t);
  execute format('create policy "read all" on %I for select using(true)',t);
  execute format('create policy "admin write" on %I for all using(is_admin()) with check(is_admin())',t);
 end loop;
 foreach t in array array['business_profiles','registrations','saved_resources','user_tasks','recommendations','notifications','ai_conversations','progress','analytics_events'] loop
  execute format('alter table %I enable row level security',t);
  execute format('create policy "own rows" on %I for all using(user_id=auth.uid() or is_admin()) with check(user_id=auth.uid())',t);
 end loop; end $$;
create function handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin insert into profiles(id,email,name,role) values(new.id,new.email,coalesce(new.raw_user_meta_data->>'name',''),case when new.email='mostafamondy79@gmail.com' then 'admin' else 'user' end); return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();
