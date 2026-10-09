-- Additive and idempotent: advance the identity sequence after explicit-id imports.
select setval(
  pg_get_serial_sequence('public.users','id'),
  greatest((select coalesce(max(id),1) from public.users),1)
);
