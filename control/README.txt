Wikster Control lives here as one built file.

The source is in a private repository. Only the build is here, and that is on
purpose rather than by accident: this page is useless to anyone who is not the
creator, because what decides whether it returns any data is a row-level
security policy in Postgres that checks whether the signed-in account is listed
in public.admins. Nobody else's session gets past it, whatever page they load.

Publishing the build is what makes the desktop launcher able to update itself
without anyone reinstalling anything, which is the whole point of it being
here.

To take it back down: delete this folder and republish. The launcher falls back
to the copy it already has.
