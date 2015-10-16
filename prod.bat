echo off
echo ************************************
echo Deploying app to PRODUCTION!
echo ************************************
pause
echo Building frontend...
call gulp
echo Deploying to Google App Engine...
call mvn appengine:update