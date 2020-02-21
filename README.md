## API

### Internal application API

#### HTTP

Get information about the current configuration of the upload-server.

```
GET /api/config
```

### Log Watcher

#### HTTP

Get list of all log files, that can be watched.

```
GET /api/log-watcher/log
```

Allow watching the log file with the specified "absolutePath".
This endpoint is only available while running the server in `-admin` mode.

```
POST /api/log-watcher/log

{"absolutePath": <path to log>}
```

Disallow watching the log file with the specified "absolutePath".
This endpoint is only available while running the server in `-admin` mode.

```
DELETE /api/log-watcher/log?absolutePath=<path to log>
```

Get size of the log file with the specified "absolutePath". Only size of log files,
returned by `GET /api/log-watcher/log`, can be obtained.

```
GET /api/log-watcher/log/size?absolutePath=<path to log>
```

Get content of the log file with the specified "absolutePath". Only content of log files,
returned by `GET /api/log-watcher/log`, can be obtained. By default, returned content
is split into an array of lines. To return content as a single string, specify "noSplit=true".
Otherwise, "noSplit" parameter is optional and can be omitted.

```
GET /api/log-watcher/log/content?absolutePath=<path to log>&noSplit=<true/false>
```

#### Web Socket

##### Legacy

Works just like in the previous versions.

Connect to the endpoint.

```
/
``` 

 Send "watch" message to watch changes in a log file:

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

### Command Executor

#### HTTP

Get list of all commands, that can be executed.

```
GET /api/command-executor/command
```

Create a new command.
This endpoint is only available while running the server in `-admin` mode.

```
POST /api/command-executor/command

{"name": "<name of the command>", "script": "<actual shell script command>"}
```

Delete a command. History of all of this command's executions will be deleted as well.
This endpoint is only available while running the server in `-admin` mode.

```
DELETE /api/command-executor/command/<command ID>
```

Get history of all executions of all commands. Command execution output is not returned by this endpoint.

```
GET /api/command-executor/execution
```

Get history of all executions of the specified command. Command execution output is
not returned by this endpoint.

```
GET /api/command-executor/command/<command ID>/execution
```

Execute specified command.

```
POST /api/command-executor/command/<command ID>/execution
```

Get information about the specified command execution. The response will contain
executions output.
"noSplit" parameter is optional and can be omitted. Be default output of the command
is returned as an array of lines. Specify "noSplit=true" in order to return the output
as a single string.

```
GET /api/command-executor/command/<command ID>/execution/<execution start time>?noSplit=<true/false>
```

Delete information about the specified command execution.

```
DELETE /api/command-executor/command/<command ID>/execution/<execution start time>
```

Gracefully terminate specified execution of the command.

```
POST /api/command-executor/command/<command ID>/execution/<execution start time>/terminate
```

Forcefully terminate specified execution of the command.

```
POST /api/command-executor/command/<command ID>/execution/<execution start time>/halt
```

#### Web Socket

Connect to this endpoint if you want to receive notifications about all command-related
events.

```
/api/command-executor/event
```

Connect to this endpoint if you want to receive notifications about all events,
related to the specified command execution.

```
/api/command-executor/command/<command ID>/execution/<execution start time>
```

Connect to this endpoint if you want to receive notifications about status change
of the specified command execution.

```
/api/command-executor/command/<command ID>/execution/<execution start time>/status
```

Connect to to this endpoint if you want to receive notifications about changes in
the output (STDOUT and STDERR) of the specified command execution.
"fromStart" parameter is optional and can be omitted. Specify it set to "true" if you want
to read existing output of the command before receiving updates about changes in it.

> Notice: normally this endpoint only allows to watch output of an active execution. Attempts to watch output of
> a complete execution will fail. *BUT*, if you specify "fromStart" set to "true" you would be able to "watch" output
> of a complete execution as well. In such case you will immediately receive all the output of the execution and then
> the connection will immediately close.
>
> Rationale: if you are watching output with "fromStart" not set or set to "false" - most likely you don't want to
> receive the entire output of the execution (either it is too big or some other thing). Watching an output of the
> complete execution in such case does not make sense since the execution is already over and you will not receive
> any events anyway. On the other hand, the behavior related to the "fromStart" set to "true", simplifies the
> cases when you just want to watch the entire output of the execution: you would not need to consider if the execution
> is complete or not, there will be no race conditions when you check if execution is active, try to watch it's output
> but it has already finished in between those two network calls, yada-yada-yada... 

```
/api/command-executor/command/<command ID>/execution/<execution start time>/output?fromStart=<true/false>
```

### Uploader

#### HTTP

> Notice: all endpoints of this API require Basic authentication. Use credentials, displayed in the log during the
> startup, as a username:password combination.

Upload a file with 'multipart/form-data' content-type. A body should have two attributes:
- file - a path, where the file should be saved
- data - actual body of the file

```
POST /api/uploader/file
or
POST /files/upload
or
POST /files/
```

Upload a file. A body of a request should contain body of the file.

```
POST /api/uploader/file?name=<path, where the file should be saved>
or
POST /files/upload?file?name=<path, where the file should be saved>
or
POST /files/?file?name=<path, where the file should be saved>
```

Move file from one location to another. Can also be used to rename a file.

```
PUT /api/uploader/file

{"oldPath": "<current path to the file>", "newPath": "<new path to the file>"}
or
POST /files/move?old_file=<current path to the file>&file=<new path to the file>
```

Delete file.

```
DELETE /api/uploader/file?name=<current path to the file>
or
POST /files/delete?file=<current path to the file>
```
