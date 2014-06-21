# Standing Fleet

Poll-based, header aggregating, small gang tool for use in EVE Online's in-game browser.
Aimed at keeping track of an entire Region's hostile movement and intel.

# Environment variables
Set these key value pairs in a '.env' and start the application with `nf start`

#### PORT
*Port number to expose the service at.*

*Ex: 8080*

#### MONGODB_URI
*MongoDB connection string. Can be empty if using memory, but must be set.*

*Ex: 'mongodb://username:password@server:port/dbname'*

#### COOKIE_SECRET
*Salt for cookie signing.*

*Ex: 'DAw23PWDxdSWD'*

#### SESSION_SECRET
*Salt for session crypto.*

*Ex: 'DAw23PWDxdSWD'*

#### STORAGE_MODE
*Storage backend to use.*

*Either 'memory' or 'mongoDb'*


# Todo

#### Server

* Multi-node support for storage. The aggressive cache behavior currently used prohibits many nodes from accessing the same armada data source.
* Add error actions that dictates client behavior. An example is telling the client to stop polling on certain errors, or to redirect to start page.

#### Client

* Move data from Data.js to separate files, or into the modules that uses it's data. It has become a monster.
* Investigate data binding framework (React?)
