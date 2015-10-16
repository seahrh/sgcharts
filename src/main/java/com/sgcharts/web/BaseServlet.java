package com.sgcharts.web;

import java.io.IOException;

import javax.servlet.ServletContext;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@SuppressWarnings("serial")
public class BaseServlet extends HttpServlet {
	private static final Logger log = LoggerFactory.getLogger(BaseServlet.class);

	@Override
	public void init() {
		// Initialization goes here
	}

	/**
	 * Forward the view to a html file
	 * 
	 * @param pageName
	 * @param req
	 * @param rsp
	 * @throws ServletException
	 * @throws IOException
	 */
	protected void forward(String pageName, HttpServletRequest req,
			HttpServletResponse rsp) throws ServletException, IOException {

		// The server should specify the character set in the Content-Type field
		// of the HTTP response header. If it does, the browser is supposed to
		// use that character set and ignore any character set that may be
		// indicated in a <meta> tag in the document being served.
		// @url
		// http://stackoverflow.com/questions/5572471/in-head-which-comes-first-meta-or-title

		rsp.setCharacterEncoding("UTF-8");
		rsp.setContentType("text/html");
		String path = path(pageName, getServletContext());
		log.info("Forward to page [{}]", path);
		req.getRequestDispatcher(path)
			.forward(req, rsp);
	}

	protected static HttpServletResponse jsonResponse(HttpServletResponse rsp,
			String json) throws IOException {
		rsp.setCharacterEncoding("UTF-8");
		rsp.setContentType("application/json");
		rsp.getWriter()
			.write(json);
		return rsp;
	}

	private static String path(String fileName, ServletContext context) {
		String root = System.getProperty("sg.pages.root");
		StringBuilder sb = new StringBuilder(root);
		sb.append(fileName);
		sb.append(".html");
		return sb.toString();
	}
}
