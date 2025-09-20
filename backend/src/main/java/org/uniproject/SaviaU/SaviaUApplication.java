package org.uniproject.SaviaU;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.uniproject.SaviaU.config.SupabaseProperties;

@SpringBootApplication
@EnableConfigurationProperties(SupabaseProperties.class)
public class SaviaUApplication {

	public static void main(String[] args) {
		SpringApplication.run(SaviaUApplication.class, args);
	}

}
