package com.sgcharts.util;

import java.util.List;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.google.common.base.CharMatcher;
import com.google.common.base.Splitter;
import com.google.common.base.Strings;
import com.google.common.collect.Sets;

public final class StringUtil {
	private static final Logger log = LoggerFactory.getLogger(StringUtil.class);
	
	public static final CharMatcher ASCII_DIGITS = CharMatcher.inRange('0', '9');
	public static final CharMatcher LATIN_LETTERS_LOWER_CASE = CharMatcher.inRange(
			'a', 'z');
	public static final CharMatcher LATIN_LETTERS_UPPER_CASE = CharMatcher.inRange(
			'A', 'Z');
	public static final CharMatcher LATIN_LETTERS = LATIN_LETTERS_LOWER_CASE.or(LATIN_LETTERS_UPPER_CASE);
	public static final CharMatcher HYPHEN = CharMatcher.is('-');
	public static final CharMatcher PERIOD = CharMatcher.is('.');
	public static final CharMatcher UNDERSCORE = CharMatcher.is('_');
	public static final CharMatcher COMMA = CharMatcher.is(',');
	public static final CharMatcher VERTICAL_LINE = CharMatcher.is('|');
	public static final CharMatcher SEMI_COLON = CharMatcher.is(';');
	public static final CharMatcher TAB = CharMatcher.is('\t');
	public static final CharMatcher HASHTAG = CharMatcher.is('#');
	private static final CharMatcher SLUG_VALID_CHARACTERS = ASCII_DIGITS.or(
			LATIN_LETTERS_LOWER_CASE)
		.or(HYPHEN);
	
	private static final Set<String> TRUTHY_VALUES = Sets.newHashSet("y", "yes", "1");
	
	private StringUtil() {
		// Private constructor; not meant to be instantiated
	}
	
	/**
	 * Trim whitespace according to latest Unicode standard (different from
	 * JDK's spec).
	 * 
	 * @param s
	 * @return
	 */
	public static String trim(String s) {
		return CharMatcher.WHITESPACE.trimFrom(s);
	}

	/**
	 * Normalize the string by trimming it.
	 * Avoids NullPointerException as nulls are transformed to an empty string.
	 * 'Blank' strings that contain only whitespace or control characters,
	 * will be transformed to an empty string.
	 * 
	 * @param s
	 * @return
	 */
	public static String norm(String s) {
		s = Strings.nullToEmpty(s);
		return trim(s);
	}
	
	public static String concat(String... strings) {
		StringBuilder sb = new StringBuilder();
		for (String s : strings) {
			sb.append(s);
		}
		return sb.toString();
	}
	
	/**
	 * Slug should contain only ASCII digits, latin letters in lowercase and
	 * hypen ('-').
	 * 
	 * @param s
	 * @return
	 */
	public static String slug(String s) {
		String slug = norm(s);
		
		if (slug.isEmpty()) {
			return slug;
		}
		
		slug = slug.toLowerCase();

		// Replace existing hyphen with whitespace,
		// so that "like - this" is later transformed to "like-this".
		// If hyphen is not adjacent to whitespace e.g. "anti-hero"
		// the hyphen will be restored later.

		slug = HYPHEN.replaceFrom(slug, ' ');

		// Collapse whitespaces down to a single space

		slug = CharMatcher.WHITESPACE.collapseFrom(slug, ' ');

		// Replace whitespace and underscore with hyphen

		slug = CharMatcher.WHITESPACE.or(UNDERSCORE)
			.replaceFrom(slug, '-');

		slug = SLUG_VALID_CHARACTERS.retainFrom(slug);

		// TODO move this assert into unit test
		//assert SLUG_VALID_CHARACTERS.matchesAllOf(slug) : slug;

		return slug;
	}
	
	public static List<String> split(String s, CharMatcher separator) {
		String msg;
		if (s == null) {
			msg = "string must not be null";
			log.error(msg);
			throw new IllegalArgumentException(msg);
		}
		return Splitter.on(separator)
				.trimResults()
				.splitToList(s);
	}
	
	public static List<String> splitAndOmitEmptyStrings(String s, CharMatcher separator) {
		String msg;
		if (s == null) {
			msg = "string must not be null";
			log.error(msg);
			throw new IllegalArgumentException(msg);
		}
		return Splitter.on(separator)
				.trimResults()
				.omitEmptyStrings()
				.splitToList(s);
	}
	
	public static boolean truthy(String s) {
		String val = norm(s).toLowerCase();
		if (TRUTHY_VALUES.contains(val)) {
			return true;
		}
		return false;
	}
	
	/**
	 * Remove formatting from a number string (such as currency symbol and thousand separator), 
	 * so that it can be parsed to a number type.
	 * Assumes there is only one period (decimal point) in the number string.
	 * @param numberString
	 * @return
	 */
	public static String unformat(String numberString) {
		CharMatcher safeChars = ASCII_DIGITS.or(PERIOD);
		return safeChars.retainFrom(numberString);
	}
}
