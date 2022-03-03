import System
import System.Info
import System.File
import Network.Socket
import Network.Socket.Data

main : IO ()
main = do
  Right sock <- socket AF_INET Stream 0
        | Left fail => putStrLn "Failed to create socket :/"
  putStrLn "This webserver doesn't yet work :("
