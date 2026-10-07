@echo off
:: ============================================================
::  USER ACCOUNT MANAGER - SysAdmin Tool
::  Run as Administrator
:: ============================================================
title User Account Manager
color 0E
mode con: cols=75 lines=45
setlocal enabledelayedexpansion

net session >nul 2>&1
if %errorLevel% neq 0 (
    echo   ERROR: Run as Administrator!
    pause
    exit /b
)

:MENU
cls
echo =========================================================
echo          USER ACCOUNT MANAGER
echo =========================================================
echo.
echo   [1]  List All User Accounts
echo   [2]  View User Details
echo   [3]  Create New User Account
echo   [4]  Delete User Account
echo   [5]  Reset User Password
echo   [6]  Enable/Disable Account
echo   [7]  Add User to Admin Group
echo   [8]  Remove User from Admin Group
echo   [9]  Show All Groups
echo   [10] Show Logged-In Users
echo   [11] Show Last Login Times
echo   [12] Lock/Unlock Account
echo   [13] Set Password to Never Expire
echo   [14] Force User Logoff
echo   [15] Export User Report
echo.
echo   [0]  Exit
echo.
echo =========================================================
set /p choice="Select an option (0-15): "

if "%choice%"=="1" goto LIST_USERS
if "%choice%"=="2" goto USER_DETAILS
if "%choice%"=="3" goto CREATE_USER
if "%choice%"=="4" goto DELETE_USER
if "%choice%"=="5" goto RESET_PASS
if "%choice%"=="6" goto ENABLE_DISABLE
if "%choice%"=="7" goto ADD_ADMIN
if "%choice%"=="8" goto REMOVE_ADMIN
if "%choice%"=="9" goto SHOW_GROUPS
if "%choice%"=="10" goto LOGGED_IN
if "%choice%"=="11" goto LAST_LOGIN
if "%choice%"=="12" goto LOCK_UNLOCK
if "%choice%"=="13" goto PASS_NOEXPIRE
if "%choice%"=="14" goto FORCE_LOGOFF
if "%choice%"=="15" goto EXPORT_REPORT
if "%choice%"=="0" exit /b
goto MENU

:LIST_USERS
cls
echo =========================================================
echo  [1] ALL USER ACCOUNTS
echo =========================================================
echo.
echo  Username                 Status       Admin?
echo  ------------------------ ------------ ------
for /f "skip=4 tokens=1" %%U in ('net user') do (
    if not "%%U"=="The" (
        set "isadmin=No"
        net localgroup Administrators 2>nul | findstr /i "%%U" >nul 2>&1
        if !errorLevel! equ 0 set "isadmin=YES"
        
        set "status=Active"
        net user "%%U" 2>nul | findstr /C:"Account active" | findstr /i "No" >nul 2>&1
        if !errorLevel! equ 0 set "status=Disabled"
        
        echo  %%U                       !status!       !isadmin!
    )
)
echo.
pause
goto MENU

:USER_DETAILS
cls
echo =========================================================
echo  [2] USER DETAILS
echo =========================================================
echo.
set /p uname="Enter Username: "
echo.
net user "%uname%"
echo.
echo  --- Group Memberships ---
net user "%uname%" | findstr /C:"Local Group" /C:"Global Group"
echo.
pause
goto MENU

:CREATE_USER
cls
echo =========================================================
echo  [3] CREATE NEW USER
echo =========================================================
echo.
set /p newuser="Enter New Username: "
set /p newpass="Enter Password: "
set /p fullname="Enter Full Name: "
set /p comment="Enter Description: "
echo.
net user "%newuser%" "%newpass%" /add /fullname:"%fullname%" /comment:"%comment%"
if %errorLevel% equ 0 (
    echo.
    echo  [DONE] User '%newuser%' created!
    echo.
    set /p makeadmin="Make this user an Admin? (Y/N): "
    if /i "!makeadmin!"=="Y" (
        net localgroup Administrators "%newuser%" /add
        echo  [DONE] Added to Administrators group!
    )
) else (
    echo  [ERROR] Failed to create user.
)
echo.
pause
goto MENU

:DELETE_USER
cls
echo =========================================================
echo  [4] DELETE USER ACCOUNT
echo =========================================================
echo.
echo  Current Users:
net user | findstr /v /C:"---" /C:"The command" /C:"User accounts"
echo.
set /p deluser="Enter Username to DELETE: "
echo.
echo  WARNING: This will permanently delete user '%deluser%'!
set /p confirm="Are you sure? (Y/N): "
if /i "%confirm%"=="Y" (
    net user "%deluser%" /delete
    if !errorLevel! equ 0 (
        echo  [DONE] User deleted!
        set /p delprofile="Delete user profile folder too? (Y/N): "
        if /i "!delprofile!"=="Y" (
            rd /s /q "C:\Users\%deluser%" >nul 2>&1
            echo  [DONE] Profile folder deleted!
        )
    )
)
echo.
pause
goto MENU

:RESET_PASS
cls
echo =========================================================
echo  [5] RESET USER PASSWORD
echo =========================================================
echo.
set /p uname="Enter Username: "
set /p newpass="Enter New Password: "
echo.
net user "%uname%" "%newpass%"
if %errorLevel% equ 0 (
    echo  [DONE] Password reset for '%uname%'!
    echo.
    set /p forcechange="Force user to change password at next login? (Y/N): "
    if /i "!forcechange!"=="Y" (
        wmic useraccount where "Name='%uname%'" set PasswordChangeable=True >nul 2>&1
        net user "%uname%" /logonpasswordchg:yes >nul 2>&1
        echo  [DONE] User must change password at next login.
    )
)
echo.
pause
goto MENU

:ENABLE_DISABLE
cls
echo =========================================================
echo  [6] ENABLE/DISABLE ACCOUNT
echo =========================================================
echo.
set /p uname="Enter Username: "
echo.
echo  [1] Enable Account
echo  [2] Disable Account
set /p action="Select (1/2): "
if "%action%"=="1" (
    net user "%uname%" /active:yes
    echo  [DONE] Account enabled!
) else (
    net user "%uname%" /active:no
    echo  [DONE] Account disabled!
)
echo.
pause
goto MENU

:ADD_ADMIN
cls
echo =========================================================
echo  [7] ADD USER TO ADMIN GROUP
echo =========================================================
echo.
set /p uname="Enter Username: "
net localgroup Administrators "%uname%" /add
echo  [DONE] '%uname%' is now an Administrator!
echo.
pause
goto MENU

:REMOVE_ADMIN
cls
echo =========================================================
echo  [8] REMOVE USER FROM ADMIN GROUP
echo =========================================================
echo.
set /p uname="Enter Username: "
net localgroup Administrators "%uname%" /delete
echo  [DONE] '%uname%' removed from Administrators!
echo.
pause
goto MENU

:SHOW_GROUPS
cls
echo =========================================================
echo  [9] ALL LOCAL GROUPS
echo =========================================================
echo.
net localgroup
echo.
set /p grp="View members of a group? Enter group name (or SKIP): "
if /i not "%grp%"=="SKIP" (
    echo.
    net localgroup "%grp%"
)
echo.
pause
goto MENU

:LOGGED_IN
cls
echo =========================================================
echo  [10] CURRENTLY LOGGED-IN USERS
echo =========================================================
echo.
echo  --- Active Sessions ---
query user 2>nul
if %errorLevel% neq 0 (
    echo  No active sessions or command not available.
    echo.
    echo  --- Alternative Check ---
    wmic computersystem get username 2>nul
)
echo.
pause
goto MENU

:LAST_LOGIN
cls
echo =========================================================
echo  [11] LAST LOGIN TIMES
echo =========================================================
echo.
echo  Username                 Last Login
echo  ------------------------ ----------------------------------
for /f "skip=4 tokens=1" %%U in ('net user') do (
    if not "%%U"=="The" (
        for /f "tokens=1-4" %%a in ('net user "%%U" 2^>nul ^| findstr /C:"Last logon"') do (
            echo  %%U                       %%c %%d
        )
    )
)
echo.
pause
goto MENU

:LOCK_UNLOCK
cls
echo =========================================================
echo  [12] LOCK/UNLOCK ACCOUNT
echo =========================================================
echo.
set /p uname="Enter Username: "
echo.
echo  [1] Unlock Account (clear lockout)
echo  [2] Lock Account (disable)
set /p action="Select (1/2): "
if "%action%"=="1" (
    net user "%uname%" /active:yes
    wmic useraccount where "Name='%uname%'" set Lockout=False >nul 2>&1
    echo  [DONE] Account unlocked!
) else (
    net user "%uname%" /active:no
    echo  [DONE] Account locked!
)
echo.
pause
goto MENU

:PASS_NOEXPIRE
cls
echo =========================================================
echo  [13] SET PASSWORD TO NEVER EXPIRE
echo =========================================================
echo.
set /p uname="Enter Username: "
wmic useraccount where "Name='%uname%'" set PasswordExpires=False >nul 2>&1
net user "%uname%" /expires:never >nul 2>&1
echo  [DONE] Password for '%uname%' will never expire!
echo.
pause
goto MENU

:FORCE_LOGOFF
cls
echo =========================================================
echo  [14] FORCE USER LOGOFF
echo =========================================================
echo.
echo  --- Active Sessions ---
query user 2>nul
echo.
set /p sid="Enter Session ID to logoff: "
logoff %sid%
echo  [DONE] Session logged off!
echo.
pause
goto MENU

:EXPORT_REPORT
cls
echo =========================================================
echo  [15] EXPORTING USER REPORT...
echo =========================================================
echo.
set "report=%USERPROFILE%\Desktop\User_Account_Report.txt"
echo ============================================ > "%report%"
echo  USER ACCOUNT REPORT - %date% %time% >> "%report%"
echo ============================================ >> "%report%"
echo. >> "%report%"
echo ====== ALL USERS ====== >> "%report%"
net user >> "%report%"
echo. >> "%report%"
echo ====== ADMIN GROUP ====== >> "%report%"
net localgroup Administrators >> "%report%"
echo. >> "%report%"
echo ====== ALL GROUPS ====== >> "%report%"
net localgroup >> "%report%"
echo. >> "%report%"
echo ====== DETAILED USER INFO ====== >> "%report%"
for /f "skip=4 tokens=1" %%U in ('net user') do (
    if not "%%U"=="The" (
        echo. >> "%report%"
        echo --- %%U --- >> "%report%"
        net user "%%U" >> "%report%" 2>nul
    )
)
echo  Report saved to Desktop: User_Account_Report.txt
notepad "%report%"
echo.
pause
goto MENU
