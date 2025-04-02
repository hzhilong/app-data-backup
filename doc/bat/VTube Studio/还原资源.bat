@echo off
color 3F
:: "申请管理员权限"
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
echo 正在查找 %app_name% 的安装目录...
call :find_install_location "%app_name%"
if "%installLocation%"=="" ( call :not_installed_then_exit "%app_name%" )
echo 软件安装目录：%installLocation%
echo ------------------------------------------
set assets=%installLocation%\VTube Studio_Data\StreamingAssets
echo 正在查找 %app_name% 的备份文件...
if not exist .backup (
    echo 缺少备份文件
    call :failed
)
set /a ii=0
for /d %%i in (".backup\*") do (
    echo [!ii!].%%~ni
    set "backup!ii!=%%i"
    set /a ii+=1
)

if "!ii!"=="0" (
    echo 缺少备份文件
    call :failed
)


:input_pos
set /p pos=请输入要还原的序号:

if %pos% lss 0 (
    echo 输入错误，请重新输入
    goto input_pos
)
if %pos% geq !ii! (
    echo 输入错误，请重新输入
    goto input_pos
)

echo 正在还原!backup%pos%!

if not exist "!backup%pos%!\VTube Studio Assets" (
    echo 缺少配置文件
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
call :delay_exit 3 操作成功
goto :eof

:failed
echo 操作失败，按任意键退出...
pause>nul
goto exit
goto :eof

:: "延迟退出，参数%1:延迟秒数 %2:提示文字"
:delay_exit 
for /l %%i in (%1,-1,1) do (
    echo %2，%%i秒后自动关闭窗口...
    choice /t 1 /d y /n >nul
)
goto exit
goto :eof

:: "提示未安装%1，按任意键退出"
:not_installed_then_exit
echo 未安装%~1，按任意键退出...
pause >nul
goto exit
goto :eof

:: "查找软件安装目录 参数%1:"软件名称"。安装路径不以\结尾"
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
