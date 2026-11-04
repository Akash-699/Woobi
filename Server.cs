using System;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading;
using System.Collections.Generic;

class Server {
    static string baseDir = @"s:\Fashion_App";
    static Dictionary<string, string> mime = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase) {
        { ".html", "text/html; charset=utf-8" },
        { ".htm", "text/html; charset=utf-8" },
        { ".css", "text/css; charset=utf-8" },
        { ".js", "application/javascript; charset=utf-8" },
        { ".mjs", "application/javascript; charset=utf-8" },
        { ".json", "application/json; charset=utf-8" },
        { ".jpg", "image/jpeg" },
        { ".jpeg", "image/jpeg" },
        { ".png", "image/png" },
        { ".svg", "image/svg+xml" },
        { ".webp", "image/webp" },
        { ".gif", "image/gif" },
        { ".ico", "image/x-icon" },
        { ".woff", "font/woff" },
        { ".woff2", "font/woff2" },
        { ".ttf", "font/ttf" },
        { ".apk", "application/vnd.android.package-archive" },
        { ".gltf", "model/gltf+json" },
        { ".glb", "model/gltf-binary" },
        { ".bin", "application/octet-stream" },
        { ".mp4", "video/mp4" }
    };

    static void Main(string[] args) {
        if (Directory.Exists(AppDomain.CurrentDomain.BaseDirectory) && File.Exists(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "index.html"))) {
            baseDir = AppDomain.CurrentDomain.BaseDirectory.TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
        }

        int[] targetPorts = new int[] { 8080, 5000, 8085 };
        int activeCount = 0;

        Console.WriteLine("====================================================");
        Console.WriteLine("  AURA Wardrobe - Fashion Showcase Localhost Server  ");
        Console.WriteLine("  Root Directory: " + baseDir);
        Console.WriteLine("====================================================");

        foreach (int p in targetPorts) {
            try {
                TcpListener listener = new TcpListener(IPAddress.Loopback, p);
                listener.Start();
                Console.WriteLine("  > Running at: http://localhost:" + p + "/");
                Console.WriteLine("  > Network:    http://127.0.0.1:" + p + "/");
                activeCount++;

                Thread listenThread = new Thread(new ParameterizedThreadStart(ListenWorker));
                listenThread.IsBackground = true;
                listenThread.Start(listener);
            } catch (Exception ex) {
                Console.WriteLine("  [Notice] Port " + p + " unavailable: " + ex.Message);
            }
        }

        if (activeCount == 0) {
            Console.WriteLine("Error: Unable to bind to any configured port.");
            return;
        }

        Console.WriteLine("====================================================\nServer listening for incoming connections...\n");
        Thread.Sleep(Timeout.Infinite);
    }

    static void ListenWorker(object obj) {
        TcpListener listener = (TcpListener)obj;
        while (true) {
            try {
                TcpClient client = listener.AcceptTcpClient();
                ThreadPool.QueueUserWorkItem(HandleClient, client);
            } catch {
                Thread.Sleep(50);
            }
        }
    }

    static void HandleClient(object obj) {
        TcpClient client = (TcpClient)obj;
        using (client) {
            client.ReceiveTimeout = 5000;
            client.SendTimeout = 5000;
            try {
                NetworkStream stream = client.GetStream();
                byte[] buf = new byte[8192];
                int n = stream.Read(buf, 0, buf.Length);
                if (n <= 0) return;

                string req = Encoding.UTF8.GetString(buf, 0, n);
                string[] lines = req.Split(new string[] { "\r\n", "\n" }, StringSplitOptions.None);
                if (lines.Length == 0) return;

                string[] parts = lines[0].Split(' ');
                if (parts.Length < 2) return;

                string method = parts[0].ToUpperInvariant();
                string url = parts[1];
                int q = url.IndexOf('?');
                if (q >= 0) url = url.Substring(0, q);
                if (url == "/" || string.IsNullOrEmpty(url)) url = "/index.html";

                string rel = Uri.UnescapeDataString(url.TrimStart('/')).Replace('/', Path.DirectorySeparatorChar);
                string path = Path.Combine(baseDir, rel);

                if (Directory.Exists(path)) {
                    path = Path.Combine(path, "index.html");
                }

                if (File.Exists(path)) {
                    string ext = Path.GetExtension(path);
                    string ctype = mime.ContainsKey(ext) ? mime[ext] : "application/octet-stream";
                    byte[] data = File.ReadAllBytes(path);

                    string header = "HTTP/1.1 200 OK\r\n" +
                                    "Content-Type: " + ctype + "\r\n" +
                                    "Content-Length: " + data.Length + "\r\n" +
                                    "Access-Control-Allow-Origin: *\r\n" +
                                    "Cache-Control: no-cache\r\n" +
                                    "Connection: close\r\n\r\n";
                    byte[] hBytes = Encoding.ASCII.GetBytes(header);
                    stream.Write(hBytes, 0, hBytes.Length);

                    if (method != "HEAD") {
                        stream.Write(data, 0, data.Length);
                    }
                    stream.Flush();
                } else {
                    string notFound = "HTTP/1.1 404 Not Found\r\nContent-Type: text/plain\r\nContent-Length: 13\r\nConnection: close\r\n\r\n404 Not Found";
                    byte[] nfBytes = Encoding.ASCII.GetBytes(notFound);
                    stream.Write(nfBytes, 0, nfBytes.Length);
                    stream.Flush();
                }
            } catch {
            }
        }
    }
}
