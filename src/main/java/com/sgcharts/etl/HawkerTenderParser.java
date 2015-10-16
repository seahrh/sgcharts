package com.sgcharts.etl;

import static com.sgcharts.util.StringUtil.VERTICAL_LINE;
import static com.sgcharts.util.StringUtil.norm;
import static com.sgcharts.util.StringUtil.split;
import static com.sgcharts.util.StringUtil.unformat;
import static com.sgcharts.util.NumberUtil.*;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.apache.commons.math3.stat.descriptive.DescriptiveStatistics;
import org.joda.time.LocalDate;
import org.joda.time.format.DateTimeFormat;
import org.joda.time.format.DateTimeFormatter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.google.common.base.CharMatcher;
import com.google.common.collect.Lists;
import com.google.common.collect.Sets;
import com.google.common.primitives.Doubles;

public final class HawkerTenderParser {
	private static final Logger log = LoggerFactory.getLogger(HawkerTenderParser.class);
	private static final String INPUT_FILE = System.getProperty("sg.in.file");
	private static final String OUTPUT_FILE = System.getProperty("sg.out.file");
	private static final String OUTPUT_BID_FILE = System.getProperty("sg.out.bid.file");
	private static final String OUTPUT_BID_PSM_FILE = System.getProperty("sg.out.bid-psm.file");
	private static final String OUTPUT_STALL_AREA_FILE = System.getProperty("sg.out.stall-area.file");
	private static final int EXPECTED_N_ROWS = Integer.parseInt(System.getProperty("sg.in.rows"));
	private static final int MIN_LENGTH = 50;
	private static final DateTimeFormatter MONTH_YEAR_FORMAT = DateTimeFormat.forPattern("MMM-yyyy");
	private static final Set<String> COOKED_FOOD_STALLS = Sets.newHashSet(
			"HALAL COOKED FOOD", "INDIAN CUISINE", "DRINKS", "COOKED FOOD",
			"CUT FRUITS");
	private static final Set<String> MARKET_STALLS = Sets.newHashSet(
			"CHILLED PORK", "FRESH SEAFOOD", "PROCESSED RAW SEAFOOD",
			"FROZEN GOODS", "HALAL FROZEN GOODS", "VEGETABLES", "POULTRY",
			"ASSORTED SPICES", "BEAN CAKES & NOODLES", "FLOWERS", "PORK",
			"WHOLE FRUITS", "EGGS", "HALAL MUTTON", "HALAL POULTRY", "BEEF",
			"HALAL BEEF", "MUTTON");
	private static final Set<String> LOCK_UP_STALLS = Sets.newHashSet(
			"PRESERVED & DRIED GOODS", "PIECE & SUNDRY GOODS");
	private static final char GROUP_BY_KEY_SEPARATOR = '|';
	private static final int NUMBER_OF_DECIMAL_PLACES = 4;

	// Column names in TSV output (appear in header row)

	private static final List<String> COLUMNS = Lists.newArrayList(
			"Hawker Centre", "Stall Number", "Stall Area (SQM)", "Trade",
			"Stall Type", "Tendered Bid ($/mo)", "Tendered Bid ($psm/mo)",
			"Month of Tender", "Year of Tender");

	private static final List<String> STATS_COLUMNS = Lists.newArrayList(
			"Hawker Centre", "Stall Type", "Year of Tender", "Count", "Min",
			"Max", "Median", "Average");

	private HawkerTenderParser() {
		// Private constructor, not meant to be instantiated
	}

	public static void main(String[] args) throws IOException {
		long startTime = System.currentTimeMillis();
		BufferedReader br = null;
		File inFile = new File(INPUT_FILE);
		String line;
		List<List<String>> data = new ArrayList<>(EXPECTED_N_ROWS);
		List<List<String>> bidStats = new ArrayList<>(EXPECTED_N_ROWS);
		List<List<String>> bidPsmStats = new ArrayList<>(EXPECTED_N_ROWS);
		List<List<String>> stallAreaStats = new ArrayList<>(EXPECTED_N_ROWS);

		// Insert header row

		data.add(COLUMNS);

		int[] groupIndices = { COLUMNS.indexOf("Hawker Centre"),
				COLUMNS.indexOf("Stall Type"),
				COLUMNS.indexOf("Year of Tender") };
		int bidIndex = COLUMNS.indexOf("Tendered Bid ($/mo)");
		int bidPsmIndex = COLUMNS.indexOf("Tendered Bid ($psm/mo)");
		int stallAreaIndex = COLUMNS.indexOf("Stall Area (SQM)");

		try {

			br = new BufferedReader(new FileReader(inFile));

			while ((line = br.readLine()) != null) {
				if (!noise(line)) {
					data.add(parse(line));
				}
			}

			TsvWriter.write(data, OUTPUT_FILE);

			// Bid statistics

			TreeMap<String, List<Double>> groups = groupBy(data,
					groupIndices, bidIndex);
			bidStats = stats(groups, STATS_COLUMNS);
			TsvWriter.write(bidStats, OUTPUT_BID_FILE);

			// Bid $psm statistics

			groups = groupBy(data,
					groupIndices, bidPsmIndex);
			bidPsmStats = stats(groups, STATS_COLUMNS);
			TsvWriter.write(bidPsmStats, OUTPUT_BID_PSM_FILE);

			// Stall area statistics

			groups = groupBy(data,
					groupIndices, stallAreaIndex);
			stallAreaStats = stats(groups, STATS_COLUMNS);
			TsvWriter.write(stallAreaStats, OUTPUT_STALL_AREA_FILE);

		} catch (Exception e) {
			log.error(e.getMessage(), e);
			throw e;
		} finally {
			if (br != null) {
				br.close();
			}
		}

		long elapsedTime = System.currentTimeMillis() - startTime;
		log.info("Done! Run time: {}s\n", elapsedTime / 1000);
	}

	private static boolean noise(String line) {
		String val = norm(line).toLowerCase();
		if (val.length() < MIN_LENGTH) {
			return true;
		}
		if (val.startsWith("tender")) {
			return true;
		}
		return false;
	}

	private static List<String> parse(String line) {
		String val = norm(line);
		if (val.isEmpty()) {
			throw new IllegalArgumentException(
					"Line must not be a null or empty string.");
		}
		List<String> row = new ArrayList<>(COLUMNS.size() * 2);
		List<String> tokens = split(val, CharMatcher.WHITESPACE);

		int indexOfStallNumber = -1;
		int indexOfTenderedBid = -1;

		Pattern stallNumberPattern = Pattern.compile("[\\da-zA-Z]+-[\\da-zA-Z]+");
		Pattern tenderedBidPattern = Pattern.compile("\\$[\\d,.]+");
		Matcher m;
		String token;
		for (int i = 0; i < tokens.size(); i++) {
			token = tokens.get(i);
			if (indexOfStallNumber == -1) {
				m = stallNumberPattern.matcher(token);
				if (m.matches()) {
					indexOfStallNumber = i;
				}
				continue;
			}
			if (indexOfTenderedBid == -1) {
				m = tenderedBidPattern.matcher(token);
				if (m.matches()) {
					indexOfTenderedBid = i;

					// Last field we are looking for, hence break out of the
					// loop

					break;
				}
				continue;
			}
		}

		if (indexOfStallNumber == -1) {
			throw new IllegalArgumentException(
					"Stall number cannot be found. Line:\n" + line);
		}
		if (indexOfTenderedBid == -1) {
			throw new IllegalArgumentException(
					"Tendered bid cannot be found. Line:\n" + line);
		}

		// Hawker centre field

		StringBuilder sb = new StringBuilder();
		for (int i = 0; i < indexOfStallNumber; i++) {
			sb.append(tokens.get(i));
			if (i != indexOfStallNumber - 1) {
				sb.append(' ');
			}
		}
		row.add(sb.toString());

		// Stall number field
		// Prepend single quote to display number as plain text

		sb = new StringBuilder("'");
		sb.append(tokens.get(indexOfStallNumber));
		row.add(sb.toString());

		// Stall area field

		String sStallArea = tokens.get(indexOfStallNumber + 1);
		row.add(sStallArea);
		double stallArea = Double.parseDouble(sStallArea);

		// Trade field

		sb = new StringBuilder();
		for (int i = indexOfStallNumber + 2; i < indexOfTenderedBid; i++) {
			sb.append(tokens.get(i));
			if (i != indexOfTenderedBid - 1) {
				sb.append(' ');
			}
		}
		String trade = sb.toString();
		row.add(trade);

		// Stall type field

		row.add(stallType(trade));

		// Tendered bid field

		String sBid = tokens.get(indexOfTenderedBid);
		row.add(sBid);
		double bid = toDouble(sBid);

		// $psm field

		double psm = bid / stallArea;
		row.add(format(psm, NUMBER_OF_DECIMAL_PLACES));

		// Year and month of tender field

		LocalDate tenderDate = LocalDate.parse(
				tokens.get(indexOfTenderedBid + 1), MONTH_YEAR_FORMAT);
		row.add(String.valueOf(tenderDate.getMonthOfYear()));
		row.add(String.valueOf(tenderDate.getYear()));
		return row;
	}

	private static String stallType(String trade) {
		if (COOKED_FOOD_STALLS.contains(trade)) {
			return "Cooked Food Stalls";
		}
		if (MARKET_STALLS.contains(trade)) {
			return "Market Stalls";
		}
		if (LOCK_UP_STALLS.contains(trade)) {
			return "Lock-Up Stalls";
		}
		throw new IllegalArgumentException("Unknown stall type for trade: "
				+ trade);
	}

	/**
	 * 
	 * @param data
	 * @param groupIndices
	 * @param valueIndex
	 * @return Map sorted by key (concatenated group fields), list of values
	 */
	private static TreeMap<String, List<Double>> groupBy(
			List<List<String>> data, int[] groupIndices, int valueIndex) {
		if (data == null || data.isEmpty()) {
			throw new IllegalArgumentException(
					"Data table must not be null or empty.");
		}
		if (groupIndices.length == 0) {
			throw new IllegalArgumentException(
					"There must be at least one group-by column.");
		}
		if (valueIndex < 0) {
			throw new IllegalArgumentException(
					"Index of the value column must be greater than or equal to zero.");
		}

		TreeMap<String, List<Double>> result = new TreeMap<String, List<Double>>();
		String key;
		List<Double> values;
		Double val;
		StringBuilder sb;
		List<String> row;

		// Skip the first row (header)

		for (int i = 1; i < data.size(); i++) {
			row = data.get(i);
			val = toDouble(row.get(valueIndex));
			sb = new StringBuilder();
			for (int j = 0; j < groupIndices.length; j++) {
				sb.append(row.get(groupIndices[j]));
				if (j != groupIndices.length - 1) {
					sb.append(GROUP_BY_KEY_SEPARATOR);
				}
			}
			key = sb.toString();
			values = result.get(key);
			if (values == null) {
				values = new ArrayList<>(EXPECTED_N_ROWS / 100);
			}
			values.add(val);
			result.put(key, values);
		}
		return result;
	}

	private static double toDouble(String bid) {
		return Double.parseDouble(unformat(bid));
	}

	private static List<List<String>> stats(
			TreeMap<String, List<Double>> groups, List<String> header) {
		if (groups == null || groups.isEmpty()) {
			throw new IllegalArgumentException(
					"Grouped data must not be null or empty");
		}
		if (header == null || header.isEmpty()) {
			throw new IllegalArgumentException(
					"Header row must not be null or empty");
		}
		List<List<String>> stats = new ArrayList<>(EXPECTED_N_ROWS);
		stats.add(header);
		List<String> row;
		String key;
		List<Double> values;
		int size = 0;
		for (Map.Entry<String, List<Double>> entry : groups.entrySet()) {
			row = new ArrayList<>(STATS_COLUMNS.size());
			key = entry.getKey();
			values = entry.getValue();

			// Group fields

			row.addAll(split(key, VERTICAL_LINE));

			// Count

			size = values.size();
			row.add(String.valueOf(size));

			// org.apache.commons.math3.stat.descriptive.DescriptiveStatistic
			// returns NaN
			// if there is only one value.
			// For single-value arrays, set all descriptive stats to the same
			// value.

			if (size == 1) {
				row.add(String.valueOf(values.get(0))); // Min
				row.add(String.valueOf(values.get(0))); // Max
				row.add(String.valueOf(values.get(0))); // Median
				row.add(String.valueOf(values.get(0))); // Mean
			} else {

				DescriptiveStatistics ds = new DescriptiveStatistics(
						Doubles.toArray(values));
				row.add(String.valueOf(ds.getMin()));
				row.add(String.valueOf(ds.getMax()));
				row.add(String.valueOf(format(ds.getPercentile(50), NUMBER_OF_DECIMAL_PLACES))); // Median
				row.add(String.valueOf(format(ds.getMean(), NUMBER_OF_DECIMAL_PLACES)));
			}
			stats.add(row);
		}
		return stats;
	}

}
