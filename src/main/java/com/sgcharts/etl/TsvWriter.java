package com.sgcharts.etl;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public final class TsvWriter {
	private static final Logger log = LoggerFactory.getLogger(TsvWriter.class);
	private static final char SEPARATOR = '\t';
	private static final char END_OF_LINE = '\n';

	private TsvWriter() {
		// Private constructor, not meant to be instantiated
	}

	public static void write(List<List<String>> data, String filePath)
			throws IOException {
		if (data == null) {
			throw new IllegalArgumentException("Data must not be null.");
		}
		if (filePath == null) {
			throw new IllegalArgumentException("File path must not be null.");
		}
		BufferedWriter bw = null;
		File file = new File(filePath);
		StringBuilder sb;
		String val;
		int size;
		try {
			bw = new BufferedWriter(new FileWriter(file));
			sb = new StringBuilder();
			for (List<String> row : data) {
				size = row.size();
				for (int i = 0; i < size; i++) {
					val = row.get(i);
					sb.append(val);
					if (i == size - 1) {
						sb.append(END_OF_LINE);
					} else {
						sb.append(SEPARATOR);
					}
				}
			}
			bw.write(sb.toString());

		} finally {
			if (bw != null) {
				bw.close();
			}
		}
	}

}
