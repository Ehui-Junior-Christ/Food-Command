@echo off
setlocal
set "MAVEN_PROJECTBASEDIR=%CD%"
:findBaseDir
IF EXIST "%MAVEN_PROJECTBASEDIR%\.mvn" goto endRead
set "MAVEN_PROJECTBASEDIR=%MAVEN_PROJECTBASEDIR%\.."
IF NOT "%MAVEN_PROJECTBASEDIR%"=="..\" goto findBaseDir
set "MAVEN_PROJECTBASEDIR=%CD%"
:endRead

set "JAVACMD=java"
if not "%JAVA_HOME%" == "" set "JAVACMD=%JAVA_HOME%\bin\java.exe"

set "WRAPPER_JAR=%MAVEN_PROJECTBASEDIR%\.mvn\wrapper\maven-wrapper.jar"
set "WRAPPER_LAUNCHER=org.apache.maven.wrapper.MavenWrapperMain"

"%JAVACMD%" %MAVEN_OPTS% -classpath "%WRAPPER_JAR%" "-Dmaven.multiModuleProjectDirectory=%MAVEN_PROJECTBASEDIR%" %WRAPPER_LAUNCHER% %*
endlocal