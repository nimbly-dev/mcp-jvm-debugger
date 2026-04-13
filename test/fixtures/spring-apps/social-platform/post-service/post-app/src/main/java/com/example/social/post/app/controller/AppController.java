package com.example.social.post.app.controller;

import com.example.social.post.api.inheritance.AbstractAppController;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v2")
public class AppController extends AbstractAppController {
}
