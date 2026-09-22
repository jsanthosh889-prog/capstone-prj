package com.poapp;

import com.poapp.entity.User;
import com.poapp.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootApplication
public class PoAppApplication {
    public static void main(String[] args) {
        SpringApplication.run(PoAppApplication.class, args);
    }

    @Bean
    public CommandLineRunner initData(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            if (userRepository.count() == 0) {
                User alice = new User();
                alice.setName("Alice Requester");
                alice.setEmail("alice@example.com");
                alice.setPassword(passwordEncoder.encode("password123"));
                alice.setRole("REQUESTER");
                userRepository.save(alice);

                User bob = new User();
                bob.setName("Bob Approver");
                bob.setEmail("bob@example.com");
                bob.setPassword(passwordEncoder.encode("password123"));
                bob.setRole("APPROVER");
                userRepository.save(bob);

                User charlie = new User();
                charlie.setName("Charlie Admin");
                charlie.setEmail("charlie@example.com");
                charlie.setPassword(passwordEncoder.encode("password123"));
                charlie.setRole("ADMIN");
                userRepository.save(charlie);
            }
        };
    }
}
