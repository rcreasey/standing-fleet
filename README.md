# Armada

Poll-based, header aggregating, small gang tool for use in EVE Online's in-game browser. Let's you keep track of your fleet mates current ship type, ship name, location and dock status, regardless of fleet hierarchy.

# Installation notes

You need to either copy *config/private.template* to *config/private.js* and enter your private settings there, or set them using environment variables defined below. 

# Environment variables

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