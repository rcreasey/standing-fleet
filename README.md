# Standing Fleet

Alliance Intelligence, visualized.

https://standing-fleet.apps.goonswarm.org/

[![wercker status](https://app.wercker.com/status/5b24ec4c6db795d1caf26367e360b743/m "wercker status")](https://app.wercker.com/project/bykey/5b24ec4c6db795d1caf26367e360b743)

## Docker development

Run and link dependency containers:

```
$ docker run -d --name db mongo 
$ docker run -d --name cache memcached
```

Build the standing-fleet container:

```
$ docker build -t standing-fleet .
```

Run the standing-fleet container with linked dependency containers:
```
$ docker run --rm --link db:db --link cache:cache --name standing-fleet -p 80:5000 -it standing-fleet
```

Connect to your docker host on port 80 (below is the default boot2docker ip)

http://192.168.59.103/

### Note for developers:
Make sure that you simulate the EVE IGB headers for your browser.  Chrome has an excellent plugin for this: [ModHeader](https://chrome.google.com/webstore/detail/modheader/idgpnmonknjnojddfkpgkljpfnnfcklj?hl=en).

Your best bet is to set all vaild [IGB headers](https://wiki.eveonline.com/en/wiki/IGB_Headers), including your actual pilot name and characterID.

## Updating the Database

Periodically, you ought to update the database off the current EVE SDE.  Do this with the gulp tasks:

```
$ docker exec -it standing-fleet ./node_modules/.bin/gulp sde:update
$ docker exec -it standing-fleet ./node_modules/.bin/gulp sde:refresh
```
