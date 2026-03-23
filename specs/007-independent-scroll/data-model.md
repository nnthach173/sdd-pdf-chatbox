# Data Model: Independent Scroll — 007

## No New Data Entities

This feature is a pure frontend layout fix. It introduces no new data entities, state, or persistence. No backend changes are required.

## Affected Frontend State

No new state is added. The following existing state is relevant for understanding scroll behavior:

### ChatInterface (existing)
- `messages: ChatMessage[]` — triggers the `scrollIntoView` `useEffect` on every change; after the layout fix, this correctly scrolls the messages container rather than the document

### ChatView (existing)
- `leftPct: number` — controls panel width split, unchanged
- `isDesktop: boolean` — controls mobile vs desktop layout, unchanged

## Scroll Container Hierarchy (post-fix)

```text
<html: h-full>
  <body: h-full>
    <HomeClient: h-screen overflow-hidden>  ← fixed to viewport
      <AppSidebar />
      <main column: flex-1 overflow-hidden>
        <AppHeader />
        <content area: flex-1 overflow-hidden>
          <ChatView: flex-1 overflow-hidden>
            <PDF panel wrapper: h-full>           ← no own scroll
              <PdfViewer: h-full overflow-y-auto> ← SCROLL CONTAINER #1
                <pages stacked vertically />
              </PdfViewer>
            </PDF panel>
            <PanelDivider />
            <Chat panel wrapper: h-full overflow-hidden>
              <ChatInterface: flex-1 overflow-hidden>
                <messages: flex-1 overflow-y-auto> ← SCROLL CONTAINER #2
                  <message list />
                  <bottomRef />
                </messages>
                <footer input bar />
              </ChatInterface>
            </Chat panel>
          </ChatView>
        </content area>
      </main column>
    </HomeClient>
  </body>
</html>
```

Two independent, isolated scroll containers. No shared document-level scroll.
