

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pgsodium";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."comment" (
    "text" "text",
    "username" "text",
    "timestamp" timestamp with time zone,
    "shortcode" "text",
    "replied_to" "text",
    "is_replied" boolean DEFAULT false,
    "id" "text" NOT NULL,
    "replies" "jsonb"[],
    "root_post" "uuid",
    "user_id" "uuid"
);


ALTER TABLE "public"."comment" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."external_contents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "content" "text",
    "top_comment" "text",
    "view_count" integer,
    "url" "text",
    "category" "text",
    "like_count" integer,
    "comment_count" integer,
    "repost_count" integer,
    "share_count" integer,
    "is_engaged" boolean,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."external_contents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."metrics" (
    "id" integer NOT NULL,
    "name" "text",
    "follower_count" integer[],
    "posts_count" integer[],
    "likes" integer[],
    "comments" integer[],
    "shares" integer[],
    "profile_views" integer[]
);


ALTER TABLE "public"."metrics" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."metrics_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."metrics_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."metrics_id_seq" OWNED BY "public"."metrics"."id";



CREATE TABLE IF NOT EXISTS "public"."my_contents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "content" "text",
    "scheduled_at" timestamp with time zone,
    "category" "text",
    "publish_status" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "my_contents_publish_status_check" CHECK (("publish_status" = ANY (ARRAY['draft'::"text", 'scheduled'::"text", 'posted'::"text"])))
);


ALTER TABLE "public"."my_contents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "password" "text",
    "name" "text" NOT NULL,
    "threads_profile_url" "text",
    "performance_data" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "email_verified" boolean DEFAULT false,
    "image" "text",
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "provider" character varying(50),
    "provider_type" character varying(50),
    "access_token" "text",
    "refresh_token" "text",
    "expires_at" timestamp without time zone,
    "email" character varying(255) NOT NULL,
    "deleted_at" timestamp with time zone,
    "publish_times" "text"[],
    "user_id" "text"
);


ALTER TABLE "public"."user_profiles" OWNER TO "postgres";


ALTER TABLE ONLY "public"."metrics" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."metrics_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."comment"
    ADD CONSTRAINT "comment_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."external_contents"
    ADD CONSTRAINT "external_contents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."metrics"
    ADD CONSTRAINT "metrics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."my_contents"
    ADD CONSTRAINT "my_contents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_user_id_key" UNIQUE ("user_id");



CREATE OR REPLACE TRIGGER "update_user_profiles_updated_at" BEFORE UPDATE ON "public"."user_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



ALTER TABLE ONLY "public"."my_contents"
    ADD CONSTRAINT "my_contents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";




















































































































































































GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";


















GRANT ALL ON TABLE "public"."comment" TO "anon";
GRANT ALL ON TABLE "public"."comment" TO "authenticated";
GRANT ALL ON TABLE "public"."comment" TO "service_role";



GRANT ALL ON TABLE "public"."external_contents" TO "anon";
GRANT ALL ON TABLE "public"."external_contents" TO "authenticated";
GRANT ALL ON TABLE "public"."external_contents" TO "service_role";



GRANT ALL ON TABLE "public"."metrics" TO "anon";
GRANT ALL ON TABLE "public"."metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."metrics" TO "service_role";



GRANT ALL ON SEQUENCE "public"."metrics_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."metrics_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."metrics_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."my_contents" TO "anon";
GRANT ALL ON TABLE "public"."my_contents" TO "authenticated";
GRANT ALL ON TABLE "public"."my_contents" TO "service_role";



GRANT ALL ON TABLE "public"."user_profiles" TO "anon";
GRANT ALL ON TABLE "public"."user_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_profiles" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
