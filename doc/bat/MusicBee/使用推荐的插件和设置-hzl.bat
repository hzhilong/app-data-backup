@echo off
color 3F
:: "�������ԱȨ��"
if exist "%SystemRoot%\SysWOW64" path %path%;%windir%\SysNative;%SystemRoot%\SysWOW64;%~dp0
bcdedit >nul
if '%errorlevel%' NEQ '0' (goto UACPrompt) else (goto UACAdmin)
:UACPrompt
%1 start "" mshta vbscript:createobject("shell.application").shellexecute("""%~0""","::",,"runas",1)(window.close)&exit
exit /B
:UACAdmin
cd /d "%~dp0"
:: =================================================================================================
set app_name=MusicBee
set installLocation=
setlocal enabledelayedexpansion

echo ------------------------------------------
echo ���ڲ��� %app_name% �İ�װĿ¼...
call :find_install_location "%app_name%"
if "%installLocation%"=="" ( call :not_installed_then_exit "%app_name%" )
echo �����װĿ¼��%installLocation%
echo ------------------------------------------

xcopy /e/y/i/f .\recommended-hzl\Plugins "%installLocation%\Plugins" >nul 2>&1
md "%appdata%\%app_name%" >nul 2>&1
set "file_src=.\recommended-hzl\MusicBee3Settings.ini"
set "file_dsc=%appdata%\%app_name%\MusicBee3Settings.ini"
(
    for /f "tokens=*" %%i in (%file_src%) do (
        set "s=%%i"
        set "s=!s:11installLocation11=%installLocation%!"
        set "s=!s:11userprofile11=%userprofile%!"
        echo,!s!
    )
)>%file_dsc%

call :succeed
goto :eof

:: =================================================================================================

:exit
exit

:succeed
call :delay_exit 3 �����ɹ�
goto :eof

:failed
echo ����ʧ�ܣ���������˳�...
pause>nul
goto exit
goto :eof

:: "�ӳ��˳�������%1:�ӳ����� %2:��ʾ����"
:delay_exit 
for /l %%i in (%1,-1,1) do (
    echo %2��%%i����Զ��رմ���...
    choice /t 1 /d y /n >nul
)
goto exit
goto :eof

:: "��ʾδ��װ%1����������˳�"
:not_installed_then_exit
echo δ��װ%~1����������˳�...
pause >nul
goto exit
goto :eof

:: "���������װĿ¼ ����%1:"�������"����װ·������\��β"
:find_install_location
    set installLocation=
    call :find_install_location_temp HKLM\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall %1
    if "!installLocation!"=="" call :find_install_location_temp HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall %1
    if "!installLocation!"=="" call :find_install_location_temp HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall %1
)
goto :eof

:find_install_location_temp
    set tempvar=
    for /f "tokens=*" %%i in ('reg query "%1"') do (
        reg query "%%i" /v "DisplayName" 2>nul | findstr /i /c:"%~2" >nul 2>&1 && (
            reg query "%%i" /v "InstallLocation" >nul 2>&1 && (
                for /f "skip=2 tokens=2,*" %%j in ('reg query "%%i" /v "InstallLocation" ') do (
                    set "installLocation=%%~k"
                    if "!installLocation:~-1!"=="\" ( 
                        set "installLocation=!installLocation:~0,-1!"
                    )
                    goto :eof
                )
            ) || ( reg query "%%i" /v "DisplayIcon" >nul 2>&1 && (
                    for /f "skip=2 tokens=2,*" %%j in ('reg query "%%i" /v "DisplayIcon" ') do (
                        for %%a in ("%%k") do set installLocation=%%~dpa
                        if "!installLocation:~-1!"=="\" ( 
                            set "installLocation=!installLocation:~0,-1!"
                        )
                        goto :eof
                    )
                )
            )
        )
    )
goto :eof
