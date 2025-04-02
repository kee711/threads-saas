create table "public"."external_contents" (
    "id" uuid not null default gen_random_uuid(),
    "content" text,
    "top_comment" text,
    "view_count" integer,
    "url" text,
    "category" text,
    "like_count" integer,
    "comment_count" integer,
    "repost_count" integer,
    "share_count" integer,
    "is_engaged" boolean,
    "created_at" timestamp with time zone default now()
);


create table "public"."my_contents" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "content" text,
    "scheduled_at" timestamp with time zone,
    "category" text,
    "publish_status" text,
    "created_at" timestamp with time zone default now()
);


create table "public"."user_profiles" (
    "id" uuid not null default gen_random_uuid(),
    "password" text not null,
    "name" text not null,
    "threads_profile_url" text,
    "performance_data" jsonb,
    "created_at" timestamp with time zone default now()
);


CREATE UNIQUE INDEX external_contents_pkey ON public.external_contents USING btree (id);

CREATE UNIQUE INDEX my_contents_pkey ON public.my_contents USING btree (id);

CREATE UNIQUE INDEX user_profiles_pkey ON public.user_profiles USING btree (id);

alter table "public"."external_contents" add constraint "external_contents_pkey" PRIMARY KEY using index "external_contents_pkey";

alter table "public"."my_contents" add constraint "my_contents_pkey" PRIMARY KEY using index "my_contents_pkey";

alter table "public"."user_profiles" add constraint "user_profiles_pkey" PRIMARY KEY using index "user_profiles_pkey";

alter table "public"."my_contents" add constraint "my_contents_publish_status_check" CHECK ((publish_status = ANY (ARRAY['draft'::text, 'scheduled'::text, 'posted'::text]))) not valid;

alter table "public"."my_contents" validate constraint "my_contents_publish_status_check";

alter table "public"."my_contents" add constraint "my_contents_user_id_fkey" FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE not valid;

alter table "public"."my_contents" validate constraint "my_contents_user_id_fkey";

grant delete on table "public"."external_contents" to "anon";

grant insert on table "public"."external_contents" to "anon";

grant references on table "public"."external_contents" to "anon";

grant select on table "public"."external_contents" to "anon";

grant trigger on table "public"."external_contents" to "anon";

grant truncate on table "public"."external_contents" to "anon";

grant update on table "public"."external_contents" to "anon";

grant delete on table "public"."external_contents" to "authenticated";

grant insert on table "public"."external_contents" to "authenticated";

grant references on table "public"."external_contents" to "authenticated";

grant select on table "public"."external_contents" to "authenticated";

grant trigger on table "public"."external_contents" to "authenticated";

grant truncate on table "public"."external_contents" to "authenticated";

grant update on table "public"."external_contents" to "authenticated";

grant delete on table "public"."external_contents" to "service_role";

grant insert on table "public"."external_contents" to "service_role";

grant references on table "public"."external_contents" to "service_role";

grant select on table "public"."external_contents" to "service_role";

grant trigger on table "public"."external_contents" to "service_role";

grant truncate on table "public"."external_contents" to "service_role";

grant update on table "public"."external_contents" to "service_role";

grant delete on table "public"."my_contents" to "anon";

grant insert on table "public"."my_contents" to "anon";

grant references on table "public"."my_contents" to "anon";

grant select on table "public"."my_contents" to "anon";

grant trigger on table "public"."my_contents" to "anon";

grant truncate on table "public"."my_contents" to "anon";

grant update on table "public"."my_contents" to "anon";

grant delete on table "public"."my_contents" to "authenticated";

grant insert on table "public"."my_contents" to "authenticated";

grant references on table "public"."my_contents" to "authenticated";

grant select on table "public"."my_contents" to "authenticated";

grant trigger on table "public"."my_contents" to "authenticated";

grant truncate on table "public"."my_contents" to "authenticated";

grant update on table "public"."my_contents" to "authenticated";

grant delete on table "public"."my_contents" to "service_role";

grant insert on table "public"."my_contents" to "service_role";

grant references on table "public"."my_contents" to "service_role";

grant select on table "public"."my_contents" to "service_role";

grant trigger on table "public"."my_contents" to "service_role";

grant truncate on table "public"."my_contents" to "service_role";

grant update on table "public"."my_contents" to "service_role";

grant delete on table "public"."user_profiles" to "anon";

grant insert on table "public"."user_profiles" to "anon";

grant references on table "public"."user_profiles" to "anon";

grant select on table "public"."user_profiles" to "anon";

grant trigger on table "public"."user_profiles" to "anon";

grant truncate on table "public"."user_profiles" to "anon";

grant update on table "public"."user_profiles" to "anon";

grant delete on table "public"."user_profiles" to "authenticated";

grant insert on table "public"."user_profiles" to "authenticated";

grant references on table "public"."user_profiles" to "authenticated";

grant select on table "public"."user_profiles" to "authenticated";

grant trigger on table "public"."user_profiles" to "authenticated";

grant truncate on table "public"."user_profiles" to "authenticated";

grant update on table "public"."user_profiles" to "authenticated";

grant delete on table "public"."user_profiles" to "service_role";

grant insert on table "public"."user_profiles" to "service_role";

grant references on table "public"."user_profiles" to "service_role";

grant select on table "public"."user_profiles" to "service_role";

grant trigger on table "public"."user_profiles" to "service_role";

grant truncate on table "public"."user_profiles" to "service_role";

grant update on table "public"."user_profiles" to "service_role";


