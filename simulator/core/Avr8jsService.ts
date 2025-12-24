/**
 * Service to interface with the Hexi Wokwi API for Arduino compilation.
 */

export interface HexiResponse {
	hex: string;
	stderr: string;
	stdout: string;
}

// import { agentCompiler } from '../../ai/agents/agents';

export async function compileSketch(sketch: string): Promise<HexiResponse> {
	// --- Adafruit_SSD1306 Library Polyfill (Auto-Injected) ---
	if (sketch.includes('Adafruit_SSD1306.h')) {
		console.log('[Avr8jsService] Injecting Adafruit_SSD1306 Polyfill...');
		const ssd1306Code = `
// --- Adafruit_SSD1306 Library Polyfill (Auto-Injected) ---
#ifndef ADAFRUIT_SSD1306_H
#define ADAFRUIT_SSD1306_H

#define SSD1306_BLACK 0
#define SSD1306_WHITE 1
#define SSD1306_INVERSE 2
#define SSD1306_SWITCHCAPVCC 0x02
#define SSD1306_EXTERNALVCC 0x01
#define SSD1306_LCDHEIGHT 64
#define SSD1306_128_64

#include <Arduino.h>
#include <Wire.h>
#include <SPI.h>
#include <Adafruit_GFX.h>

// Standard 5x7 Font
const uint8_t font[] PROGMEM = {
    0x00, 0x00, 0x00, 0x00, 0x00, 
    0x3E, 0x5B, 0x4F, 0x5B, 0x3E, 0x3E, 0x6B, 0x4F, 0x6B, 0x3E, 0x1C, 0x3E, 0x7C, 0x3E, 0x1C, 
    0x18, 0x3C, 0x7E, 0x3C, 0x18, 0x1C, 0x57, 0x7D, 0x57, 0x1C, 0x1C, 0x5E, 0x7F, 0x5E, 0x1C, 
    0x00, 0x18, 0x3C, 0x18, 0x00, 0xFF, 0xE7, 0xC3, 0xE7, 0xFF, 0x00, 0x18, 0x24, 0x18, 0x00, 
    0xFF, 0xE7, 0xDB, 0xE7, 0xFF, 0x30, 0x48, 0x3A, 0x06, 0x0E, 0x26, 0x29, 0x79, 0x29, 0x26, 
    0x40, 0x7F, 0x05, 0x05, 0x07, 0x40, 0x7F, 0x05, 0x25, 0x3F, 0x5A, 0x3C, 0xE7, 0x3C, 0x5A, 
    0x7F, 0x3E, 0x1C, 0x1C, 0x08, 0x08, 0x1C, 0x1C, 0x3E, 0x7F, 0x14, 0x22, 0x7F, 0x22, 0x14, 
    0x5F, 0x5F, 0x5F, 0x5F, 0x5F, 0x06, 0x59, 0x49, 0x55, 0x06, 0x20, 0x54, 0x54, 0x54, 0x78, 
    0x7F, 0x49, 0x49, 0x49, 0x41, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x5f, 0x00, 0x00, 
    0x00, 0x07, 0x00, 0x07, 0x00, 0x14, 0x7f, 0x14, 0x7f, 0x14, 0x24, 0x2a, 0x7f, 0x2a, 0x12, 
    0x23, 0x13, 0x08, 0x64, 0x62, 0x36, 0x49, 0x55, 0x22, 0x50, 0x00, 0x05, 0x03, 0x00, 0x00, 
    0x00, 0x1c, 0x22, 0x41, 0x00, 0x00, 0x41, 0x22, 0x1c, 0x00, 0x14, 0x08, 0x3e, 0x08, 0x14, 
    0x08, 0x08, 0x3e, 0x08, 0x08, 0x00, 0x50, 0x30, 0x00, 0x00, 0x08, 0x08, 0x08, 0x08, 0x08, 
    0x00, 0x60, 0x60, 0x00, 0x00, 0x20, 0x10, 0x08, 0x04, 0x02, 0x3e, 0x51, 0x49, 0x45, 0x3e, 
    0x00, 0x42, 0x7f, 0x40, 0x00, 0x42, 0x61, 0x51, 0x49, 0x46, 0x21, 0x41, 0x45, 0x4b, 0x31, 
    0x18, 0x14, 0x12, 0x7f, 0x10, 0x27, 0x45, 0x45, 0x45, 0x39, 0x3c, 0x4a, 0x49, 0x49, 0x30, 
    0x01, 0x71, 0x09, 0x05, 0x03, 0x36, 0x49, 0x49, 0x49, 0x36, 0x06, 0x49, 0x49, 0x29, 0x1e, 
    0x00, 0x36, 0x36, 0x00, 0x00, 0x00, 0x56, 0x36, 0x00, 0x00, 0x08, 0x14, 0x22, 0x41, 0x00, 
    0x14, 0x14, 0x14, 0x14, 0x14, 0x00, 0x41, 0x22, 0x14, 0x08, 0x02, 0x01, 0x51, 0x09, 0x06, 
    0x32, 0x49, 0x79, 0x41, 0x3e, 0x7e, 0x11, 0x11, 0x11, 0x7e, 0x7f, 0x49, 0x49, 0x49, 0x36, 
    0x3e, 0x41, 0x41, 0x41, 0x22, 0x7f, 0x41, 0x41, 0x22, 0x1c, 0x7f, 0x49, 0x49, 0x49, 0x41, 
    0x7f, 0x09, 0x09, 0x09, 0x01, 0x3e, 0x41, 0x49, 0x49, 0x7a, 0x7f, 0x08, 0x08, 0x08, 0x7f, 
    0x00, 0x41, 0x7f, 0x41, 0x00, 0x20, 0x40, 0x41, 0x3f, 0x01, 0x7f, 0x08, 0x14, 0x22, 0x41, 
    0x7f, 0x40, 0x40, 0x40, 0x40, 0x7f, 0x02, 0x0c, 0x02, 0x7f, 0x7f, 0x04, 0x08, 0x10, 0x7f, 
    0x3e, 0x41, 0x41, 0x41, 0x3e, 0x7f, 0x09, 0x09, 0x09, 0x06, 0x3e, 0x41, 0x51, 0x21, 0x5e, 
    0x7f, 0x09, 0x19, 0x29, 0x46, 0x46, 0x49, 0x49, 0x49, 0x31, 0x01, 0x01, 0x7f, 0x01, 0x01, 
    0x3f, 0x40, 0x40, 0x40, 0x3f, 0x1f, 0x20, 0x40, 0x20, 0x1f, 0x3f, 0x40, 0x38, 0x40, 0x3f, 
    0x63, 0x14, 0x08, 0x14, 0x63, 0x07, 0x08, 0x70, 0x08, 0x07, 0x61, 0x51, 0x49, 0x45, 0x43, 
    0x00, 0x7f, 0x41, 0x41, 0x00, 0x02, 0x04, 0x08, 0x10, 0x20, 0x00, 0x41, 0x41, 0x7f, 0x00, 
    0x04, 0x02, 0x01, 0x02, 0x04, 0x40, 0x40, 0x40, 0x40, 0x40, 0x00, 0x01, 0x02, 0x04, 0x00, 
    0x20, 0x54, 0x54, 0x54, 0x78, 0x7f, 0x48, 0x44, 0x44, 0x38, 0x38, 0x44, 0x44, 0x44, 0x20, 
    0x38, 0x44, 0x44, 0x48, 0x7f, 0x38, 0x54, 0x54, 0x54, 0x18, 0x08, 0x7e, 0x09, 0x01, 0x02, 
    0x0c, 0x52, 0x52, 0x52, 0x3e, 0x7f, 0x08, 0x04, 0x04, 0x78, 0x00, 0x44, 0x7d, 0x40, 0x00, 
    0x20, 0x40, 0x44, 0x3d, 0x00, 0x7f, 0x10, 0x28, 0x44, 0x00, 0x00, 0x41, 0x7f, 0x40, 0x00, 
    0x7c, 0x04, 0x18, 0x04, 0x78, 0x7c, 0x08, 0x04, 0x04, 0x78, 0x38, 0x44, 0x44, 0x44, 0x38, 
    0x7c, 0x14, 0x14, 0x14, 0x08, 0x08, 0x14, 0x14, 0x18, 0x7c, 0x7c, 0x08, 0x04, 0x04, 0x08, 
    0x48, 0x54, 0x54, 0x54, 0x20, 0x04, 0x3f, 0x44, 0x40, 0x20, 0x3c, 0x40, 0x40, 0x20, 0x7c, 
    0x1c, 0x20, 0x40, 0x20, 0x1c, 0x3c, 0x40, 0x30, 0x40, 0x3c, 0x44, 0x28, 0x10, 0x28, 0x44, 
    0x0c, 0x50, 0x50, 0x50, 0x3c, 0x44, 0x64, 0x54, 0x4c, 0x44, 0x08, 0x36, 0x41, 0x00, 0x00, 
    0x00, 0x00, 0x77, 0x00, 0x00, 0x00, 0x41, 0x36, 0x08, 0x00, 0x08, 0x08, 0x2a, 0x1c, 0x08, 
    0x08, 0x1c, 0x2a, 0x08, 0x08 
};

class Adafruit_SSD1306 : public Print {
    private:
        uint8_t i2c_addr;
        uint8_t *buffer;
        uint16_t width, height;
        int16_t cursor_x, cursor_y;
        uint16_t textcolor;
        uint8_t textsize;
        bool wrap;

    public:
        // Constructor (Inline)
        Adafruit_SSD1306(uint16_t w, uint16_t h, TwoWire *twi = &Wire, int8_t rst_pin = -1) {
            _init(w, h);
        }

        // SPI Constructor (Legacy / Software SPI)
        // We ignore the pins for simulation and force I2C usage because the simulator component is I2C.
        Adafruit_SSD1306(int8_t mosi, int8_t sclk, int8_t dc, int8_t rst, int8_t cs) {
            _init(128, 64); // Default to 128x64 for this constructor
        }

        void _init(uint16_t w, uint16_t h) {
            width = w;
            height = h;
            cursor_x = 0;
            cursor_y = 0;
            textcolor = SSD1306_WHITE;
            textsize = 1;
            wrap = true;
            buffer = (uint8_t *)malloc((w * h) / 8);
            if (buffer) memset(buffer, 0, (w * h) / 8);
        }

        // Standard Signature: begin(switchvcc, i2caddr, reset, periphBegin)
        // We ignore switchvcc and use i2caddr.
        bool begin(uint8_t switchvcc = SSD1306_SWITCHCAPVCC, uint8_t i2caddr = 0x3C, bool reset = true, bool periphBegin = true) {
            i2c_addr = i2caddr;
            Wire.begin();
            // Serial.println("SSD1306: begin called");
            return true;
        }

        void display(void) {
            if (!buffer) return;
            // Serial.println("SSD1306: display called");

            // 1. Setup Column/Page for full screen update (Horizontal addressing)
            Wire.beginTransmission(i2c_addr);
            Wire.write(0x00); 
            Wire.write(0x20); Wire.write(0x00); 
            Wire.write(0x21); Wire.write(0); Wire.write(127);
            Wire.write(0x22); Wire.write(0); Wire.write(7);
            Wire.endTransmission();

            // 2. Send the buffer in chunks
            uint16_t count = (width * height) / 8;
            uint8_t *ptr = buffer;
            
            for (uint16_t i = 0; i < count; i += 16) {
                Wire.beginTransmission(i2c_addr);
                Wire.write(0x40);
                for (uint16_t j = 0; j < 16 && (i + j) < count; j++) {
                    Wire.write(ptr[i + j]);
                }
                Wire.endTransmission();
            }
        }

        void clearDisplay(void) {
            if (buffer) memset(buffer, 0, (width * height) / 8);
            cursor_x = 0;
            cursor_y = 0;
        }

        void drawPixel(int16_t x, int16_t y, uint16_t color) {
            if (!buffer) return;
            if ((x < 0) || (x >= width) || (y < 0) || (y >= height)) return;

            switch (color) {
                case SSD1306_WHITE:   buffer[x + (y / 8) * width] |=  (1 << (y & 7)); break;
                case SSD1306_BLACK:   buffer[x + (y / 8) * width] &= ~(1 << (y & 7)); break;
                case SSD1306_INVERSE: buffer[x + (y / 8) * width] ^=  (1 << (y & 7)); break;
            }
        }

        void setCursor(int16_t x, int16_t y) {
            cursor_x = x;
            cursor_y = y;
        }

        void setTextSize(uint8_t s) {
            textsize = (s > 0) ? s : 1;
        }

        void setTextColor(uint16_t c) {
            textcolor = c;
        }

        void setTexture(bool w) {
            wrap = w;
        }

        void drawChar(int16_t x, int16_t y, unsigned char c, uint16_t color, uint8_t size) {
            if ((x >= width) || (y >= height) || ((x + 6 * size - 1) < 0) || ((y + 8 * size - 1) < 0)) return;

            if (c >= 176) c++; 

            for (int8_t i = 0; i < 5; i++) { 
                uint8_t line = pgm_read_byte(&font[(c * 5) + i]);
                for (int8_t j = 0; j < 8; j++, line >>= 1) {
                    if (line & 1) {
                        if (size == 1)
                            drawPixel(x + i, y + j, color);
                        else
                            for (uint8_t sx = 0; sx < size; sx++) {
                                for (uint8_t sy = 0; sy < size; sy++) {
                                    drawPixel(x + i * size + sx, y + j * size + sy, color);
                                }
                            }
                    }
                }
            }
        }

        size_t write(uint8_t c) {
            if (c == 0x0A) { 
                cursor_y += textsize * 8;
                cursor_x = 0;
            } else if (c == 0x0D) { 
                // skip
            } else {
                if (wrap && (cursor_x + textsize * 6 > width)) {
                    cursor_y += textsize * 8;
                    cursor_x = 0;
                }
                drawChar(cursor_x, cursor_y, c, textcolor, textsize);
                cursor_x += textsize * 6;
            }
            return 1;
        }
};

#endif

// --- End Polyfill ---
`;
		// Replace current include with a comment
		sketch = sketch.replace(/#include\s*[<"]Adafruit_SSD1306\.h[>"]/g, '// #include <Adafruit_SSD1306.h> (Polyfilled)');

		// Prepend the library code to the sketch
		sketch = ssd1306Code + '\n' + sketch;

		console.log("Injected Adafruit_SSD1306 polyfill.");
	}

	// --- HX711 Polyfill Injection ---
	if (sketch.includes('<HX711.h>') || sketch.includes('"HX711.h"')) {
		console.log('[Avr8jsService] Injecting HX711 Library Polyfill...');
		const hx711Code = `
// --- HX711 Library Polyfill (Auto-Injected) ---
#ifndef HX711_h
#define HX711_h
#include <Arduino.h>

class HX711
{
	private:
		byte PD_SCK;	// Power Down and Serial Clock Input Pin
		byte DOUT;		// Serial Data Output Pin
		byte GAIN;		// amplification factor
		long OFFSET = 0;	// used for tare weight
		float SCALE = 1;	// used to return weight in grams, kg, ounces, whatever

	public:
		HX711();
		virtual ~HX711();
		void begin(byte dout, byte pd_sck, byte gain = 128);
		bool is_ready();
		void wait_ready(unsigned long delay_ms = 0);
		bool wait_ready_retry(int retries = 3, unsigned long delay_ms = 0);
		bool wait_ready_timeout(unsigned long timeout = 1000, unsigned long delay_ms = 0);
		void set_gain(byte gain = 128);
		long read();
		long read_average(byte times = 10);
		double get_value(byte times = 1);
		float get_units(byte times = 1);
		void tare(byte times = 10);
		void set_scale(float scale = 1.f);
		float get_scale();
		void set_offset(long offset = 0);
		long get_offset();
		void power_down();
		void power_up();
};
#endif

// --- HX711.cpp Implementation ---
HX711::HX711() {
}

HX711::~HX711() {
}

void HX711::begin(byte dout, byte pd_sck, byte gain) {
	PD_SCK = pd_sck;
	DOUT = dout;

	pinMode(PD_SCK, OUTPUT);
	pinMode(DOUT, INPUT); // Default to INPUT

	set_gain(gain);
}

bool HX711::is_ready() {
	return digitalRead(DOUT) == LOW;
}

void HX711::set_gain(byte gain) {
	switch (gain) {
		case 128:		// channel A, gain factor 128
			GAIN = 1;
			break;
		case 64:		// channel A, gain factor 64
			GAIN = 3;
			break;
		case 32:		// channel B, gain factor 32
			GAIN = 2;
			break;
	}

}

long HX711::read() {
	// Wait for the chip to become ready.
	wait_ready();

	// Define structures for reading data into.
	unsigned long value = 0;
	uint8_t data[3] = { 0 };
	uint8_t filler = 0x00;

    // Use standard shiftIn (Slow CPU / AVR)
    // Pulse the clock pin 24 times to read the data.
    data[2] = shiftIn(DOUT, PD_SCK, MSBFIRST);
    data[1] = shiftIn(DOUT, PD_SCK, MSBFIRST);
    data[0] = shiftIn(DOUT, PD_SCK, MSBFIRST);

	// Set the channel and the gain factor for the next reading using the clock pin.
	for (unsigned int i = 0; i < GAIN; i++) {
		digitalWrite(PD_SCK, HIGH);
		delayMicroseconds(1);
		digitalWrite(PD_SCK, LOW);
		delayMicroseconds(1);
	}

	// Replicate the most significant bit to pad out a 32-bit signed integer
	if (data[2] & 0x80) {
		filler = 0xFF;
	} else {
		filler = 0x00;
	}

	// Construct a 32-bit signed integer
	value = ( static_cast<unsigned long>(filler) << 24
			| static_cast<unsigned long>(data[2]) << 16
			| static_cast<unsigned long>(data[1]) << 8
			| static_cast<unsigned long>(data[0]) );

	return static_cast<long>(value);
}

void HX711::wait_ready(unsigned long delay_ms) {
	while (!is_ready()) {
		delay(delay_ms);
	}
}

bool HX711::wait_ready_retry(int retries, unsigned long delay_ms) {
	int count = 0;
	while (count < retries) {
		if (is_ready()) {
			return true;
		}
		delay(delay_ms);
		count++;
	}
	return false;
}

bool HX711::wait_ready_timeout(unsigned long timeout, unsigned long delay_ms) {
	unsigned long millisStarted = millis();
	while (millis() - millisStarted < timeout) {
		if (is_ready()) {
			return true;
		}
		delay(delay_ms);
	}
	return false;
}

long HX711::read_average(byte times) {
	long sum = 0;
	for (byte i = 0; i < times; i++) {
		sum += read();
		delay(0);
	}
	return sum / times;
}

double HX711::get_value(byte times) {
	return read_average(times) - OFFSET;
}

float HX711::get_units(byte times) {
	return get_value(times) / SCALE;
}

void HX711::tare(byte times) {
	double sum = read_average(times);
	set_offset(sum);
}

void HX711::set_scale(float scale) {
	SCALE = scale;
}

float HX711::get_scale() {
	return SCALE;
}

void HX711::set_offset(long offset) {
	OFFSET = offset;
}

long HX711::get_offset() {
	return OFFSET;
}

void HX711::power_down() {
	digitalWrite(PD_SCK, LOW);
	digitalWrite(PD_SCK, HIGH);
}

void HX711::power_up() {
	digitalWrite(PD_SCK, LOW);
}

// --- End Polyfill ---
`;
		// Replace current include with a comment
		sketch = sketch.replace(/#include\s*[<"]HX711\.h[>"]/g, '// #include <HX711.h> (Polyfilled)');

		// Prepend the library code to the sketch
		sketch = hx711Code + '\n' + sketch;

		console.log("Injected HX711 polyfill.");
	}

	// --- IRremote Polyfill Injection ---
	if (sketch.includes('<IRremote.h>') || sketch.includes('"IRremote.h"')) {
		console.log('[Avr8jsService] Injecting IRremote Polyfill...');
		// Simplified NEC-only blocking decoder
		const irCode = `
// --- IRremote Polyfill (Auto-Injected) ---
#ifndef IRremote_h
#define IRremote_h
#include <Arduino.h>

struct decode_results {
    unsigned long value;
    int bits;
    volatile unsigned int *rawbuf;
    int rawlen;
    int decode_type;
};

class IRrecv {
    int _recvpin;
  public:
    IRrecv(int pin) { _recvpin = pin; }
    void enableIRIn() { pinMode(_recvpin, INPUT); }
    void resume() {} // No-op, we decode instantly
    
    // Blocking NEC decoder
    bool decode(decode_results *results) {
        if (digitalRead(_recvpin) == HIGH) return false;
        
        // Debug: We saw a LOW signal
        Serial.println("IR: Start detected");

        // 1. Leader Mark: 9ms LOW
        unsigned long start = micros();
        while (digitalRead(_recvpin) == LOW) {
            if (micros() - start > 12000) return false; 
        }
        unsigned long duration = micros() - start;
        Serial.print("IR: Leader Mark "); Serial.println(duration);

        if (duration < 7000 || duration > 10000) return false;
        
        // 2. Leader Space: 4.5ms HIGH
        start = micros();
        while (digitalRead(_recvpin) == HIGH) {
           if (micros() - start > 6000) return false;
        }
        duration = micros() - start;
        Serial.print("IR: Leader Space "); Serial.println(duration);

        if (duration < 3000 || duration > 5500) return false;
        
        // 3. Read 32 bits
        unsigned long data = 0;
        for (int i = 0; i < 32; i++) {
            start = micros();
            while (digitalRead(_recvpin) == LOW) {
                 if (micros() - start > 1000) return false;
            }
            
            start = micros();
            while (digitalRead(_recvpin) == HIGH) {
                if (micros() - start > 2500) break;
            }
            duration = micros() - start;
            
            if (duration > 1000) {
                 data |= (1UL << (31 - i));
            }
        }
        
        Serial.print("IR: Decoded 0x"); Serial.println(data, HEX);
        
        results->value = data;
        results->bits = 32;
        results->decode_type = 1; // NEC
        return true;
    }
};
#endif
// --- End Polyfill ---
`;
		sketch = sketch.replace(/#include\s*[<"]IRremote\.h[>"]/g, '// #include <IRremote.h> (Polyfilled)');
		sketch = irCode + '\n' + sketch;
	}

	// 1. Try Official API
	try {
		let libraries = '';

		// Check for OLED and force ALL dependencies including Core ones
		if (sketch.includes('Adafruit_SSD1306.h')) {
			libraries += 'Adafruit BusIO@1.14.1\n';
			libraries += 'Adafruit GFX Library@1.11.5\n';
			libraries += 'Adafruit SSD1306@2.5.7\n';
			libraries += 'Wire\n'; // Explicitly ask for Wire
			libraries += 'SPI\n';  // Explicitly ask for SPI
		}

		if (sketch.includes('Adafruit_ILI9341.h')) {
			libraries += 'Adafruit BusIO@1.14.1\n';
			libraries += 'Adafruit GFX Library@1.11.5\n';
			libraries += 'Adafruit ILI9341@1.5.17\n';
			libraries += 'Wire\n';
			libraries += 'SPI\n';
		}



		// Hexi fails if the library string ends with a newline
		libraries = libraries.trim();

		// CACHE BUSTER: Add a random comment to the end of the sketch
		// This forces the server to re-compile instead of returning a cached error.
		const sketchWithCacheBuster = sketch + `\n// CacheBuster: ${Math.random()}`;

		console.log("[Avr8jsService] Sending libraries to Hexi:", libraries);

		const response = await fetch('https://hexi.wokwi.com/build', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				sketch: sketchWithCacheBuster, // Send the modified sketch
				libraries
			}),
		});

		const result = await response.json();

		// FIX: If hex exists, return it. If not, Log the STDERR to console!
		if (response.ok && result.hex) {
			return result;
		} else {
			console.error("---------------- COMPILER ERROR ----------------");
			console.error(result.stderr || "No stderr returned");
			console.warn("Detailed result:", result);
		}

	} catch (error) {
		console.warn("Compiler API Network Error:", error);
	}

	// 2. Fallback to AI Compiler (Disabled in this version)
	return {
		hex: '',
		stderr: 'Compilation failed. Please check your code.',
		stdout: ''
	};
}

/**
 * Simple Intel HEX parser.
 * Converts a HEX string into a Uint8Array suitable for the AVR8js runner.
 */
export function parseHex(hex: string): Uint8Array {
	const buffer = new Uint8Array(32 * 1024); // 32KB for ATmega328P flash
	const lines = hex.split('\n');

	for (const line of lines) {
		if (!line.startsWith(':')) continue;
		const count = parseInt(line.substr(1, 2), 16);
		const addr = parseInt(line.substr(3, 4), 16);
		const type = parseInt(line.substr(7, 2), 16);

		if (type === 0x00) { // Data Record
			for (let i = 0; i < count; i++) {
				const byte = parseInt(line.substr(9 + i * 2, 2), 16);
				if (addr + i < buffer.length) {
					buffer[addr + i] = byte;
				}
			}
		} else if (type === 0x01) { // EOF
			break;
		}
	}

	return buffer;
}
