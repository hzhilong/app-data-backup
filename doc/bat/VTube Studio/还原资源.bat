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
set app_name=VTube Studio
set installLocation=
setlocal enabledelayedexpansion

echo ------------------------------------------
echo ���ڲ��� %app_name% �İ�װĿ¼...
call :find_install_location "%app_name%"
if "%installLocation%"=="" ( call :not_installed_then_exit "%app_name%" )
echo �����װĿ¼��%installLocation%
echo ------------------------------------------
set assets=%installLocation%\VTube Studio_Data\StreamingAssets
echo ���ڲ��� %app_name% �ı����ļ�...
if not exist .backup (
    echo ȱ�ٱ����ļ�
    call :failed
)
set /a ii=0
for /d %%i in (".backup\*") do (
    echo [!ii!].%%~ni
    set "backup!ii!=%%i"
    set /a ii+=1
)

if "!ii!"=="0" (
    echo ȱ�ٱ����ļ�
    call :failed
)


:input_pos
set /p pos=������Ҫ��ԭ�����:

if %pos% lss 0 (
    echo �����������������
    goto input_pos
)
if %pos% geq !ii! (
    echo �����������������
    goto input_pos
)

echo ���ڻ�ԭ!backup%pos%!

if not exist "!backup%pos%!\VTube Studio Assets" (
    echo ȱ�������ļ�
    call :failed
)

md "%appdata%\obs-studio" >nul 2>&1
xcopy /e/y/i/f "!backup%pos%!\VTube Studio Assets" "%assets%\" >nul || call :failed
echo ------------------------------------------

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
