# JS-Backend

access token - access token is generally expires in short period of time.
refresh token - refresh token is stored in DB.

the main idea behind this tokens that to avoide repeated login.

suppose client have an access token which will expire in 15 mins.
so every time client need to login which is headach

so what this token does - when we client recive 401 status code we simply handle it like send one http request with refresh token match this refresh token with DB(refresh token)
if token matches simply renew access token. thats it.
