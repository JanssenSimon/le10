import System
import System.Info
import System.File
import Network.Socket
import Network.Socket.Data

main : IO ()
main = do 
  Right sock <- socket AF_INET Stream 0
    | Left fail => putStrLn "Failed to create socket :/"
  _ <- bind sock (Just (IPv4Addr 0 0 0 0)) 80
  _ <- listen sock
  threadID <- fork (serve sock)
  threadWait threadID
  putStrLn "This webserver doesn't yet work :("
  close sock
  where
    serve : Socket -> IO()
    serve sock = do
      putStrLn "Heyo we serving the socket in a fork!"
