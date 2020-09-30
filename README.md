# Setup Server
Before starting the server make sure to create a **.env** file in the server directory.

The .env file needs to specify following variables:

```
SQL_HOST=[IP address without port]
SQL_USER=[Database user with access rights]
SQL_PASSWORD=[Password for user account]
SQL_DATABASE=[Database name]
```

Optionally add a desired port number with the PORT variable.

Install dependencies
- cd into the server directory
- install node_modules via `npm install`

# Start Server

- start the development server via `npm run dev`

Note that the corresponding mysql server has to be started beforehand.

# Setup Client
- cd into the client directory
- install node_modules via `npm install`
- **IMPORTANT**: Change the property **BASE_URL** of the class **API** under _/src/components/NorovaAnalytics/models/API.ts_ if needed.

# Start Client

- start the application via `npm start`

Note that the server needs to be running.
