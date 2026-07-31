rem # replace rfcexec.exe (or any other started server) executable in the destination SM59 in the ABAP backend
rem # with this script to enable the trace more easily, to set other environment variables or redirect output, etc....
rem # Here we are interested in the command line arguments passed by the gateway, the user and the process IDs.
@echo off
set OUTPUT_FILE=%cd%\startrfcexec.txt

rem utf8
chcp 65001 >>"%OUTPUT_FILE%"


echo %* >>"%OUTPUT_FILE%"

rem write PID of the parent process of this powershell command (i.e. this shell) to file and read it
set PID_FILE=%cd%\startrfcexecScriptPid.txt
powershell -NoProfile -ExecutionPolicy Bypass -Command "(Get-WmiObject Win32_Process -Filter ProcessId=$PID).ParentProcessId" >"%PID_FILE%"
set /p thisPid=<"%PID_FILE%"


powershell -NoProfile -ExecutionPolicy Bypass -Command "(Get-WmiObject Win32_Process -Filter ProcessId=%thisPid%).ParentProcessId" >"%PID_FILE%"
set /p PPid=<"%PID_FILE%"


set EXEC_PATH=%cd%\rfcexec.exe
@echo user=%username% pid=%thisPid% ppid=%PPid% >>"%OUTPUT_FILE%"
@echo %date% %time% "%cd%" start rfcexec >>"%OUTPUT_FILE%"
@"%EXEC_PATH%" %* -f .\rfcexec.sec -t RFC_TRACE=4 CPIC_TRACE=3 >>"%OUTPUT_FILE%"
@echo %date% %time% "%cd%" end rfcexec >>"%OUTPUT_FILE%"