select supabase_auth.admin_create_user(
  '{"email": "clatadmin@clatprep.com", "password": "Admin@123", "email_confirm": true, "user_metadata": {"full_name": "Clat Admin"}}'::jsonb
);

update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'clatadmin@clatprep.com');
