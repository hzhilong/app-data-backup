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
set app_name=WinSCP
set "reg_path1=HKEY_CURRENT_USER\SOFTWARE\Martin Prikryl\WinSCP 2"
set "reg_path2=HKEY_CURRENT_USER\SOFTWARE\Martin Prikryl\WinSCP 2 Override"
set installLocation=
setlocal enabledelayedexpansion

echo ------------------------------------------
echo 正在查找 %app_name% 的安装目录...
call :find_install_location "%app_name%"
if "!installLocation!"=="" (
    if exist "C:\Program Files (x86)\%app_name%" ( set "installLocation=C:\Program Files (x86)\%app_name%")
    if exist "D:\Program Files (x86)\%app_name%" ( set "installLocation=D:\Program Files (x86)\%app_name%")
    if exist "C:\Program Files\%app_name%" ( set "installLocation=C:\Program Files\%app_name%")
    if exist "D:\Program Files\%app_name%" ( set "installLocation=D:\Program Files\%app_name%")
)
if "!installLocation!"=="" ( call :not_installed_then_exit "%app_name%" )
echo 软件安装目录：!installLocation!
echo ------------------------------------------

for /f "tokens=2 delims==" %%a in ('wmic path win32_operatingsystem get LocalDateTime /value') do (
  set timestamp=%%a
)
md .backup >nul 2>&1
set "dir=.backup/backup_%timestamp:~0,4%-%timestamp:~4,2%-%timestamp:~6,2%_%timestamp:~8,2%-%timestamp:~10,2%-%timestamp:~12,2%"
md "%dir%"


:: 1-注册表 2-程序目录 3-自定义
set flag=1
set custom_path=

reg query "%reg_path2%" /v "IniFile" >nul 2>&1 && (
    for /f "skip=2 tokens=2,*" %%j in ('reg query "%reg_path2%" /v "IniFile" ') do (
        if "%%k"=="" (
            if exist "!installLocation!\WinSCP.ini" (
                set flag=2
            )
        ) ^
        else (
            set "custom_path=%%k"
            set flag=3
            set "custom_path=!custom_path:%%5C=\!"
            set "custom_path=!custom_path:%%20= !"
        )
    )
)

if "!flag!"=="1" (
    echo 当前配置文件存储在注册表
    reg export "%reg_path1%" "%dir%\backup1.reg" >nul || call :failed
) ^
else if "!flag!"=="2" (
    echo 当前配置文件存储在程序目录：!installLocation!\WinSCP.ini
    if not exist "!installLocation!\WinSCP.ini" (
        echo 该文件不存在
        call :failed
    )
    copy /y "!installLocation!\WinSCP.ini" "%dir%\" >nul 2>&1 || call :failed
) ^
else if "!flag!"=="3" (
    echo 当前配置文件存储在自定义目录：!custom_path!
    if not exist "!custom_path!" (
        echo 该文件不存在
        call :failed
    )
    echo !custom_path!> "%dir%\custom_path"
    copy /y "!custom_path!" "%dir%\WinSCP.ini" >nul 2>&1 || call :failed
)
reg export "%reg_path2%" "%dir%\backup2.reg" >nul 2>&1
echo !flag!> "%dir%\flag"

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
