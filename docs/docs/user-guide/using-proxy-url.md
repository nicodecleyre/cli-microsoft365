# Configure CLI for Microsoft 365 to use a proxy

If you are behind a corporate proxy, you'll have to configure CLI for Microsoft 365 to use a proxy server to access Microsoft 365 services. You can configure a proxy URL using the [cli config set](/docs/docs/cmd/cli/config/config-set.md) command.

## Understanding Proxy URL

Before configuring the proxy, it's important to understand the different parts of a proxy URL. A proxy URL typically consists of the following elements:

- **protocol**: The protocol used by the proxy server, such as `HTTP`, `HTTPS`, or `SOCKS`
- **username and password**: if the proxy server requires authentication, you will need to provide a username and password
- **host**: the hostname or IP address of the proxy server
- **port number**: the port number on which the proxy server is listening. Defaults to 443 for the `HTTPS` protocol, otherwise it defaults to 80 when not provided

## Configuring Proxy URL

To configure CLI for Microsoft 365 to use a proxy, you need to execute the `m365 cli config set` command with the following syntax:

`m365 cli config set --key proxyUrl --value 'http://username:password@proxy.contoso.com:8080'`

Here, replace `username` and `password` with your credentials, `proxy.contoso.com` with the hostname or IP address of the proxy server, and `8080` with the port number used by the proxy server.

If your proxy server doesn't require authentication, you can omit the `username:password@` part from the URL: