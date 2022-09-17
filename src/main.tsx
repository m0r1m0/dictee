import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { ChakraProvider } from "@chakra-ui/react"

const root = document.createElement('div');
root.id = 'dictee-root'
document.body.append(root);

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <ChakraProvider><App /></ChakraProvider>
  </React.StrictMode>
);
