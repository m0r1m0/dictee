import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { ChakraProvider, extendTheme } from "@chakra-ui/react"

const injectScript = (filePath: string, tag: string) => {
  const node = document.getElementsByTagName(tag)[0];
  const script = document.createElement('script');
  script.setAttribute('type', 'text/javascript');
  script.setAttribute('src', filePath);
  node.appendChild(script);
}

injectScript(chrome.runtime.getURL("hijack.js"), 'body')

const root = document.createElement('div');
root.id = 'dictee-root'
document.body.append(root);

const theme = extendTheme({
  styles: {
    global: {
      body: {
        backgroundColor: "#141414"
      }
    }
  }
})

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <ChakraProvider theme={theme} >
      <App />
    </ChakraProvider>
  </React.StrictMode>
);
