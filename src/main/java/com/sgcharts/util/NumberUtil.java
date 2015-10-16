package com.sgcharts.util;

import java.math.RoundingMode;
import java.text.DecimalFormat;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public final class NumberUtil {
	private static final Logger log = LoggerFactory.getLogger(NumberUtil.class);
	
	
	private NumberUtil() {
		// Private constructor; not meant to be instantiated
	}
	
	public static String format(double value, int nDecimalPlaces) {
		if (nDecimalPlaces < 1) {
			throw new IllegalArgumentException("Number of decimal places must be a positive number.");
		}
		StringBuilder sb = new StringBuilder("#.");
		for (int i = 0; i < nDecimalPlaces; i++) {
			sb.append("#");
		}
		DecimalFormat df = new DecimalFormat(sb.toString());
		df.setRoundingMode(RoundingMode.HALF_UP);
		return df.format(value);
	}
}
