import System
import System.Info
import System.File
import Network.Socket
import Network.Socket.Data

main : IO ()
main = do 
  Right sock <- socket AF_INET Stream 0
    | Left fail => putStrLn "Failed to create socket :/"
  _ <- bind sock (Just (IPv4Addr 127 0 0 1)) 80
  putStrLn "This webserver doesn't yet work :("
  close sock
