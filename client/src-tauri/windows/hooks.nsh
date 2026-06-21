; NSIS_POSTUNINSTALL hook — runs after NSIS removes app files/registry
; Opt-in deletion of WebView2 data (IndexedDB + localStorage)

!macro NSIS_HOOK_POSTUNINSTALL
  MessageBox MB_YESNO|MB_ICONQUESTION \
    "Do you want to also remove all sales data? This cannot be undone." \
    IDNO skip_data_cleanup

  ; Clear WebView2 storage — where Dexie (IndexedDB) and localStorage reside
  RMDir /r "$LOCALAPPDATA\com.pharmacy.pos\EBWebView\"

  skip_data_cleanup:
!macroend
