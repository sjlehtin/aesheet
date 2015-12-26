*** Settings ***
Library  Process
Library  Selenium2Library
Suite Setup  Start the webserver
Suite Teardown  Uninitialize Test System

*** Variables ***
${SERVER}         localhost:8002
${BROWSER}        Chrome
${DELAY}          0
${VALID USER}     admin
${VALID PASSWORD}    admin
${LOGIN URL}      http://${SERVER}/

*** Test Cases ***
Valid login
    Go to frontpage
    Input Username  ${VALID USER}
    Input Password  password  ${VALID PASSWORD}
    Click Button  login
    Page Should Contain  Add a new sheet
    [Teardown]  Close Browser

Invalid login
    Go to frontpage
    Input Username  ${VALID USER}
    Input Password  password  foobar
    Click Button  login
    Page Should Contain  Your username and password didn't match. Please try again.
    [Teardown]  Close Browser

Add character note
    Valid login
    Click Link  sheet for Asa
    Page Should Contain  <h1>Asa</h1>
    Page Should Not Contain  This is a new character note.
    Click Element  character-note
    Input text  character-note  This is a new character note.
    Click Button  character-note  # Submit.
    Reload Page
    Page Should Contain  This is a new character note.

*** Keywords ***
Valid login
    Go to frontpage
    Input Username  ${VALID USER}
    Input Password  password  ${VALID PASSWORD}
    Click Button  login
    Page Should Contain  Add a new sheet

Start the webserver
    # XXX Fixture data, including the user and a sheet and some items.
    ${django process}=  Start Process  python  ${CURDIR}/../../manage.py  runserver  ${SERVER}  env:DB_NAME=${CURDIR}/test.db
    Process Should Be Running
    Set suite variable  ${django process}

Stop the webserver
    Terminate Process  ${django process}

Uninitialize Test System
    Stop the webserver
    Close All Browsers
    Terminate All Processes

Input Username
    [arguments]  ${username}
    Input text  username  ${username}

Go to frontpage
    Open Browser  ${LOGIN URL}  ${BROWSER}
