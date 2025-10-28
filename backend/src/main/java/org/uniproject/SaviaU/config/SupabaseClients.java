package org.uniproject.SaviaU.config;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.beans.factory.annotation.Qualifier;

@Component
public class SupabaseClients {

    private final SupabaseProperties props;
    private final WebClient dbAnon;
    private final WebClient authPublic;
    private final WebClient dbAdmin;
    private final WebClient authAdmin;
    private final WebClient storageAdmin;

    public SupabaseClients(@Qualifier("supabaseProperties") SupabaseProperties props) {
        this.props = props;
        this.dbAnon = WebClient.builder()
                .baseUrl(props.getUrl() + "/rest/v1")
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .defaultHeader("apikey", props.getAnonKey())
                .defaultHeader("Authorization", "Bearer " + props.getAnonKey())
                .build();
        this.authPublic = WebClient.builder()
                .baseUrl(props.getUrl() + "/auth/v1")
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .defaultHeader("apikey", props.getAnonKey())
                .build();
        this.dbAdmin = WebClient.builder()
                .baseUrl(props.getUrl() + "/rest/v1")
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .defaultHeader("apikey", props.getServiceRoleKey())
                .defaultHeader("Authorization", "Bearer " + props.getServiceRoleKey())
                .build();
        this.authAdmin = WebClient.builder()
                .baseUrl(props.getUrl() + "/auth/v1")
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .defaultHeader("apikey", props.getServiceRoleKey())
                .defaultHeader("Authorization", "Bearer " + props.getServiceRoleKey())
                .build();
        this.storageAdmin = WebClient.builder()
                .baseUrl(props.getUrl() + "/storage/v1")
                .defaultHeader("apikey", props.getServiceRoleKey())
                .defaultHeader("Authorization", "Bearer " + props.getServiceRoleKey())
                .build();
    }

    public SupabaseProperties getProps() { return props; }
    public WebClient getDbAnon() { return dbAnon; }
    public WebClient getAuthPublic() { return authPublic; }
    public WebClient getDbAdmin() { return dbAdmin; }
    public WebClient getAuthAdmin() { return authAdmin; }
    public WebClient getStorageAdmin() { return storageAdmin; }

    public WebClient buildUserAuthClient(String accessToken) {
        return WebClient.builder()
                .baseUrl(props.getUrl() + "/auth/v1")
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .defaultHeader("apikey", props.getAnonKey())
                .defaultHeader("Authorization", "Bearer " + accessToken)
                .build();
    }
}
