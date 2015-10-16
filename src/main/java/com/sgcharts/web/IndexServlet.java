package com.sgcharts.web;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@SuppressWarnings("serial")
public class IndexServlet extends BaseServlet {
	private static final Logger log = LoggerFactory
			.getLogger(IndexServlet.class);

	private static final String PAGE_NAME = "index";
	
	@Override
	public void doGet(HttpServletRequest req, HttpServletResponse rsp)
			throws IOException, ServletException {
		forward(PAGE_NAME, req, rsp);
	}
}
