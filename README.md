## API

### Log Watcher

#### HTTP

```
GET /api/log-watcher/log
```

Get list of all log files, that can be watched.

```
POST /api/log-watcher/log

{"absolutePath": <path to log>}
```

Allow watching the log file with the specified "absolutePath".
This endpoint is only available while running the server in `-insecure` mode.

```
DELETE /api/log-watcher/log?absolutePath=<path to log>
```

Disallow watching the log file with the specified "absolutePath".
This endpoint is only available while running the server in `-insecure` mode.

```
GET /api/log-watcher/log/size?absolutePath=<path to log>
```

Get size of the log file with the specified "absolutePath". Only size of log files,
returned by `GET /api/log-watcher/log`, can be obtained.

```
GET /api/log-watcher/log/content?absolutePath=<path to log>&noSplit=<true/false>
```
Get content of the log file with the specified "absolutePath". Only content of log files,
returned by `GET /api/log-watcher/log`, can be obtained. By default, returned content
is split into an array of lines. To return content as a single string, specify "noSplit=true".
Otherwise, "noSplit" parameter is optional and can be omitted.

#### Web Socket

##### Legacy

```
/
```

Works just like in the previous versions. 

Connect to the endpoint. Send "watch" message to watch changes in a log file:

```json
{
  "type": "watch",
  "file": "<absolute path to log file>",
  "fromStart": true
}
```

"fromStart" parameter is optional and can be omitted. Specify it set to "true" if you want
to read existing contents of the file before receiving updates about changes in it.

Only log files, returned by `GET /api/log-watcher/log`, can be watched.

To stop watching changes in a log file - use "unwatch" message:

```json
{
  "type": "unwatch",
  "file": "<absolute path to log file>"
}
```

##### Default

Connect to the endpoint of the log file, you want watch.

```
/api/log-watcher/log?absolutePath=<path to log>&fromStart=<true/false>
```

"fromStart" parameter is optional and can be omitted. Specify it set to "true" if you want
to read existing contents of the file before receiving updates about changes in it.

Only log files, returned by `GET /api/log-watcher/log`, can be watched.