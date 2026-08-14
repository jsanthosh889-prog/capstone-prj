package com.poapp.service;

import com.poapp.config.JwtUtil;
import com.poapp.dto.AuthResponse;
import com.poapp.dto.LoginRequest;
import com.poapp.dto.RegisterRequest;
import com.poapp.dto.UserResponse;
import com.poapp.entity.User;
import com.poapp.exception.ResourceNotFoundException;
import com.poapp.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    public UserResponse register(RegisterRequest request) {
        // Validate required fields
        if (request.getName() == null || request.getName().trim().isEmpty() ||
            request.getEmail() == null || request.getEmail().trim().isEmpty() ||
            request.getPassword() == null || request.getPassword().trim().isEmpty() ||
            request.getRole() == null || request.getRole().trim().isEmpty()) {
            throw new IllegalArgumentException("All registration fields are required.");
        }

        // Validate role input
        String role = request.getRole().toUpperCase();
        if (!role.equals("REQUESTER") && !role.equals("APPROVER") && !role.equals("ADMIN")) {
            throw new IllegalArgumentException("Invalid role. Role must be REQUESTER, APPROVER, or ADMIN.");
        }

        // Check if email already exists
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Email is already registered.");
        }

        // Create new user entity and encrypt password
        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(role);

        User savedUser = userRepository.save(user);

        // Return user details response without password
        return new UserResponse(
                savedUser.getId(),
                savedUser.getName(),
                savedUser.getEmail(),
                savedUser.getRole(),
                savedUser.getCreatedAt()
        );
    }

    public AuthResponse login(LoginRequest request) {
        if (request.getEmail() == null || request.getEmail().trim().isEmpty() ||
            request.getPassword() == null || request.getPassword().trim().isEmpty()) {
            throw new IllegalArgumentException("Email and password are required.");
        }

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password."));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Invalid email or password.");
        }

        // Generate token and return authentication details
        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole());

        return new AuthResponse(
                token,
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole()
        );
    }
}
