api_request
===========

Simple library for defining API requests asynchronously. Creates readable requests using a fuild chainable interface. Detects the content type and decodes it accordingy (currently available for application/json and application/x-www-form-urlencoded). Also, if one specifies the content type, a JS object may be passed in and it will be converted to the proper format by the proper content encoder.

Installing
----------

At your command prompt type:
```
npm install api_request
```

Usage
-----

Just include the library and start building requests:

```js
var api_request = require('api_request');

var r = new api_request('http', 'themarg.in');
r.get('/').on('reply', function(reply, res) {
    console.log(reply);
});
```

Also, you could make a request over SSL with basic authentication:

```js
var r = new api_request('https', 'auth.themarg.in');
r.with_basic_auth('ada', '4d4').
  get('/index.php').on('reply', function(reply, res) {
    console.log(reply.greeting);
});
```

Or, you could post a JSON object over HTTPS with basic authentication:

```js
var r = new api_request('https', 'auth.themarg.in');
r.with_content_type('application/json').
  with_basic_auth('ada', '4d4').
  with_payload({'greeting': 'hi'}).
  post('/index.php').on('reply', function(reply, res) {
    console.log(reply.greeting);
});
```

Currently the only supported protocols are http or https. If someone wrote a module for another protocol that could be used as well, since it loads the module via a require statement.

It supports the four basic http verbs: 'GET', 'POST'. 'PUT', 'DELETE'.

Headers can be set like so:

```js
var r = new api_request('http', 'themarg.in');
r.add_headers({'X-Orginating-IP': '192.168.5.3'}).
  get('/index.php').on('reply', function(reply, res) {
    console.log(reply);
});
```

Multiple headers can be set at once.

Content Encoders and Handlers
-----------------------------

If the API you use this with requests or replies with a different format from x-www-form-urlencoded or json, the library can be extended by providing a content encoder or content handler object. It's quite simple, actually:

```js
var r = new api_request('https', 'auth.themarg.in');
r.add_content_handlers({
  'appplication/rss+xml': function(data) {
    return decoded_data;
  }
});
```

To send a different encoding, it goes like this:

```js
var r = new api_request('https', 'auth.themarg.in');
r.add_content_encoders({
  'appplication/rss+xml': function(data) {
    return encoded_data;
  }
});
```

More than one type of encoder or handler can be added at a time.

Vocabulary
----------

* get(uri)
* post(uri)
* put(uri)
* del(uri)
* with_payload(data) -- chainable
* with_basic_auth(user, pass) -- chainable
* add_headers(headers_object) -- chainable
* add_content_encoders(encoder_object)
* add_content_handlers(handler_object)
* set_length(bytes) -- chainable
