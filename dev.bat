echo off
echo Building frontend...
call gulp
echo Deploying to devserver...
call mvn appengine:devserver