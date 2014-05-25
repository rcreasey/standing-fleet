**Armada**

Poll-based, header aggregating, small gang tool for use in EVE Online's in-game browser. Let's you keep track of your fleet mates current ship type, ship name, location and dock status, regardless of fleet hierarchy.

**Installation notes**

You need to either copy *config/private.template* to *config/private.js* and enter your private settings there, or set them using environment variables defined below. 

**Environment variables**

* PORT
* MONGODB_URI
* COOKIE_SECRET
* SESSION_SECRET
* STORAGE_MODE

**Todo**

Server

* Multi-node support for storage. The aggressive cache behavior currently used prohibits many nodes from accessing the same armada data source. 
* Add error actions that dictates client behavior. An example is telling the client to stop polling on certain errors, or to redirect to start page.

Client

* Move data from Data.js to separate files, or into the modules that uses it's data. It has become a monster.
* Investigate data binding framework (React?)