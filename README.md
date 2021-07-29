# InstacronJS

This project started with just terraforming https://github.com/basnijholt/instacron but this gave a few issues. After reducing the file size of the package so lambda would accept it I learned about how embeded filesystem use is to the implementation. Since there is no filesystem in AWS lambda this proved to be a blocker. Re-implementing instacron with an instagram library that doesn't depend on a file system proved to be the simplest solution. 

## New features

Instacron now has the following new features:
- It reads from a dropbox account and keeps track of the uploaded files
- It can be deployed to run routinely on aws lambda using terraform
