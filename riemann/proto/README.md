If you want to update the proto.proto file [using one of riemann's releases](http://riemann.io/howto.html#write-a-client), you must run the following command in order to properly update the proto.desc file:

```bash
protoc --descriptor_set_out=proto.desc --include_imports proto.proto 
```